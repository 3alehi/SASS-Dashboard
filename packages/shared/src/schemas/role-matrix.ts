import { z } from 'zod';

import { PERMISSIONS } from '../constants/permissions.js';
import { ORGANIZATION_ROLES } from '../constants/roles.js';

export const roleMatrixEntrySchema = z.object({
  role: z.enum(ORGANIZATION_ROLES),
  permissions: z.array(z.enum(PERMISSIONS)),
});
export type RoleMatrixEntry = z.infer<typeof roleMatrixEntrySchema>;

export const roleMatrixSchema = z.array(roleMatrixEntrySchema);
export type RoleMatrix = z.infer<typeof roleMatrixSchema>;
