export interface MerchantNormalizationResult {
  displayName: string | null;
  normalizedName: string | null;
}

const normalizeWhitespace = (value: string): string =>
  value.trim().replace(/\s+/g, " ");

const LEGAL_SUFFIX_PATTERN = /\b(?:pvt|private|limited|ltd|llp|llc|inc|corp|corporation|company|co|gmbh|plc|sa|sas)\b/gi;

const stripLegalSuffixes = (value: string): string =>
  value.replace(LEGAL_SUFFIX_PATTERN, " ").replace(/\s+/g, " ").trim();

const sanitizeForNormalization = (value: string): string => {
  const accentStripped = value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
  return accentStripped.replace(/[^a-z0-9\s]/gi, " ");
};

export const normalizeMerchantName = (input: string | null | undefined): MerchantNormalizationResult => {
  if (input == null) {
    return { displayName: null, normalizedName: null };
  }

  const trimmed = input.trim();
  if (!trimmed) {
    return { displayName: null, normalizedName: null };
  }

  const displayName = normalizeWhitespace(trimmed);
  const sanitized = sanitizeForNormalization(displayName);
  const normalizedCandidate = stripLegalSuffixes(sanitized);
  const normalizedName = normalizedCandidate ? normalizedCandidate.toLowerCase() : null;

  return { displayName, normalizedName };
};
