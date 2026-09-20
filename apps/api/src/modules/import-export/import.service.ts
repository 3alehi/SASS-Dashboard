import type {
  CreateCustomerInput,
  CreateLeadInput,
  CustomerStatus,
  ImportableEntity,
  ImportResult,
  ImportRowResult,
  LeadStatus,
} from '@nexora/shared';
import { createCustomerSchema, createLeadSchema } from '@nexora/shared';
import { parse } from 'csv-parse/sync';
import { ZodError } from 'zod';

import { createCustomer } from '@/modules/customers/customers.repository.js';
import { createLead } from '@/modules/leads/leads.repository.js';

type RawRow = Record<string, string | undefined>;

/**
 * Header matching is case/whitespace-insensitive and accepts either the
 * export column header ("Full Name") or the raw field name ("fullName"),
 * so a file round-tripped through our own export always imports cleanly,
 * and a hand-edited spreadsheet with slightly different casing still works.
 */
function makeFieldReader(row: RawRow) {
  const normalized = new Map<string, string>();
  for (const [key, value] of Object.entries(row)) {
    normalized.set(key.trim().toLowerCase(), value ?? '');
  }

  return (...candidateHeaders: string[]): string => {
    for (const candidate of candidateHeaders) {
      const value = normalized.get(candidate.trim().toLowerCase());
      if (value !== undefined) return value;
    }
    return '';
  };
}

function parseCsv(csvContent: string): RawRow[] {
  return parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true,
  }) as RawRow[];
}

function toCustomerInput(row: RawRow): CreateCustomerInput {
  const field = makeFieldReader(row);

  const raw = {
    name: field('Name', 'name'),
    company: field('Company', 'company'),
    email: field('Email', 'email'),
    phone: field('Phone', 'phone'),
    website: field('Website', 'website'),
    status: (field('Status', 'status').toUpperCase() || undefined) as CustomerStatus | undefined,
    source: field('Source', 'source'),
    industry: field('Industry', 'industry'),
    value: field('Value', 'value') || undefined,
    notes: field('Notes', 'notes'),
  };

  return createCustomerSchema.parse(raw);
}

function toLeadInput(row: RawRow): CreateLeadInput {
  const field = makeFieldReader(row);

  const raw = {
    fullName: field('Full Name', 'fullName', 'Name', 'name'),
    company: field('Company', 'company'),
    email: field('Email', 'email'),
    phone: field('Phone', 'phone'),
    status: (field('Status', 'status').toUpperCase() || undefined) as LeadStatus | undefined,
    source: field('Source', 'source'),
    value: field('Value', 'value') || undefined,
    notes: field('Notes', 'notes'),
  };

  return createLeadSchema.parse(raw);
}

const MAX_IMPORT_ROWS = 2000;

export async function importEntityFromCsv(
  organizationId: string,
  createdBy: string,
  entity: ImportableEntity,
  csvContent: string,
): Promise<ImportResult> {
  let rows: RawRow[];
  try {
    rows = parseCsv(csvContent);
  } catch (error) {
    throw new Error(`Could not parse CSV file: ${error instanceof Error ? error.message : 'invalid format'}`);
  }

  if (rows.length > MAX_IMPORT_ROWS) {
    throw new Error(`CSV has ${rows.length} rows; the maximum per import is ${MAX_IMPORT_ROWS}.`);
  }

  const results: ImportRowResult[] = [];

  for (let index = 0; index < rows.length; index += 1) {
    const rowNumber = index + 2; // +1 for 1-indexing, +1 for the header row
    const row = rows[index]!;

    try {
      if (entity === 'customers') {
        const input = toCustomerInput(row);
        const customer = await createCustomer(organizationId, createdBy, input);
        results.push({ row: rowNumber, success: true, id: customer.id, error: null });
      } else {
        const input = toLeadInput(row);
        const lead = await createLead(organizationId, createdBy, input);
        results.push({ row: rowNumber, success: true, id: lead.id, error: null });
      }
    } catch (error) {
      const message =
        error instanceof ZodError
          ? summarizeZodError(error)
          : error instanceof Error
            ? error.message
            : 'Unknown error';
      results.push({ row: rowNumber, success: false, id: null, error: message });
    }
  }

  const successCount = results.filter((result) => result.success).length;

  return {
    totalRows: rows.length,
    successCount,
    errorCount: results.length - successCount,
    results,
  };
}

function summarizeZodError(error: ZodError): string {
  return error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ');
}
