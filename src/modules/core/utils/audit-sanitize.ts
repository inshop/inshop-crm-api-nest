const SENSITIVE_KEYS = new Set(['password']);

function flattenValue(value: unknown): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  if (Array.isArray(value)) {
    if (value.length > 0 && typeof value[0] === 'object' && value[0] !== null) {
      if ('role' in value[0]) {
        return value.map((item) =>
          typeof item === 'object' && item !== null && 'role' in item
            ? (item as { role: string }).role
            : item,
        );
      }
    }
    return value;
  }

  if (typeof value === 'object') {
    if ('name' in value && typeof (value as { name: unknown }).name === 'string') {
      return (value as { name: string }).name;
    }
    if ('id' in value) {
      return (value as { id: unknown }).id;
    }
  }

  return value;
}

export function sanitizeForAudit(
  entity: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(entity)) {
    if (SENSITIVE_KEYS.has(key)) {
      continue;
    }

    result[key] = flattenValue(value);
  }

  return result;
}

export function computeAuditDiff(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
): Record<string, { old: unknown; new: unknown }> {
  const sanitizedBefore = sanitizeForAudit(before);
  const sanitizedAfter = sanitizeForAudit(after);
  const diff: Record<string, { old: unknown; new: unknown }> = {};
  const keys = new Set([
    ...Object.keys(sanitizedBefore),
    ...Object.keys(sanitizedAfter),
  ]);

  for (const key of keys) {
    const oldVal = sanitizedBefore[key];
    const newVal = sanitizedAfter[key];

    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      diff[key] = { old: oldVal, new: newVal };
    }
  }

  return diff;
}
