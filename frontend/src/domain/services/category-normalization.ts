export interface CategoryNormalizationResult {
  displayName: string | null;
  normalizedName: string | null;
}

const normalizeWhitespace = (value: string): string =>
  value.trim().replace(/\s+/g, " ");

const sanitizeForNormalization = (value: string): string => {
  const accentStripped = value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
  return accentStripped.replace(/[^a-z0-9\s]/gi, " ");
};

export const normalizeCategoryName = (
  input: string | null | undefined
): CategoryNormalizationResult => {
  if (input == null) {
    return { displayName: null, normalizedName: null };
  }

  const trimmed = input.trim();
  if (!trimmed) {
    return { displayName: null, normalizedName: null };
  }

  const displayName = normalizeWhitespace(trimmed);
  const sanitized = sanitizeForNormalization(displayName);
  const normalizedWhitespace = normalizeWhitespace(sanitized);
  const normalizedName = normalizedWhitespace ? normalizedWhitespace.toLowerCase() : null;

  return { displayName, normalizedName };
};
