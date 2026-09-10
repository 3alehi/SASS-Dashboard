import { describe, expect, it } from 'vitest';

import {
  changePasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from '@/schemas/auth';

describe('loginSchema', () => {
  it('accepts a valid email and non-empty password', () => {
    const result = loginSchema.safeParse({ email: 'user@example.com', password: 'anything' });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid email', () => {
    const result = loginSchema.safeParse({ email: 'not-an-email', password: 'anything' });
    expect(result.success).toBe(false);
  });

  it('rejects an empty password', () => {
    const result = loginSchema.safeParse({ email: 'user@example.com', password: '' });
    expect(result.success).toBe(false);
  });
});

describe('registerSchema', () => {
  const base = {
    fullName: 'Amir Salehi',
    email: 'amir@example.com',
    password: 'Passw0rd1',
    confirmPassword: 'Passw0rd1',
  };

  it('accepts matching strong passwords', () => {
    expect(registerSchema.safeParse(base).success).toBe(true);
  });

  it('rejects mismatched passwords', () => {
    const result = registerSchema.safeParse({ ...base, confirmPassword: 'Different1' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toContain('confirmPassword');
    }
  });

  it('rejects a password missing an uppercase letter', () => {
    const result = registerSchema.safeParse({
      ...base,
      password: 'password1',
      confirmPassword: 'password1',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a password missing a number', () => {
    const result = registerSchema.safeParse({
      ...base,
      password: 'Password',
      confirmPassword: 'Password',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a password shorter than 8 characters', () => {
    const result = registerSchema.safeParse({
      ...base,
      password: 'Pw1',
      confirmPassword: 'Pw1',
    });
    expect(result.success).toBe(false);
  });
});

describe('resetPasswordSchema', () => {
  it('rejects mismatched passwords', () => {
    const result = resetPasswordSchema.safeParse({
      password: 'Passw0rd1',
      confirmPassword: 'Passw0rd2',
    });
    expect(result.success).toBe(false);
  });
});

describe('changePasswordSchema', () => {
  it('requires a non-empty current password', () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: '',
      newPassword: 'Passw0rd1',
      confirmPassword: 'Passw0rd1',
    });
    expect(result.success).toBe(false);
  });

  it('accepts a valid change-password payload', () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: 'OldPassw0rd',
      newPassword: 'Passw0rd1',
      confirmPassword: 'Passw0rd1',
    });
    expect(result.success).toBe(true);
  });
});
