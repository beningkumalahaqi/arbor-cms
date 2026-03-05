export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

export function validateRequired(
  fields: Record<string, string>,
  requiredKeys: string[]
): ValidationResult {
  const errors: Record<string, string> = {};

  for (const key of requiredKeys) {
    if (!fields[key] || fields[key].trim() === "") {
      errors[key] = `${key} is required.`;
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validateSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}
