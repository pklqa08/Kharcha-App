export type EntityId = string;

export const isEntityId = (value: string): boolean => value.trim().length > 0;

export const requireEntityId = (value: string, fieldName = "id"): EntityId => {
  const normalized = value.trim();
  if (!normalized) {
    throw new Error(`${fieldName} cannot be empty`);
  }
  return normalized;
};
