const SENSITIVE_KEYS = new Set(['password']);
const SKIP_AUDIT_KEYS = new Set(['password', 'featureFlag', 'plainToken']);

function environmentLabel(environment: unknown): string {
  if (typeof environment !== 'object' || environment === null) {
    return String(environment ?? '?');
  }

  if ('name' in environment && typeof environment.name === 'string') {
    return environment.name;
  }

  if ('code' in environment && typeof environment.code === 'string') {
    return environment.code;
  }

  if ('id' in environment) {
    return String(environment.id);
  }

  return '?';
}

function flattenEnvironmentValue(item: unknown): string {
  if (typeof item !== 'object' || item === null) {
    return String(item ?? '?');
  }

  const enabled =
    'enabled' in item ? (item as { enabled: boolean }).enabled : undefined;
  const environment =
    'environment' in item
      ? (item as { environment: unknown }).environment
      : undefined;

  if (enabled !== undefined) {
    return `${environmentLabel(environment)}: ${enabled ? 'enabled' : 'disabled'}`;
  }

  return environmentLabel(item);
}

function isEnvironmentValueItem(item: unknown): boolean {
  return (
    typeof item === 'object' &&
    item !== null &&
    'enabled' in item &&
    ('environment' in item || 'environmentId' in item)
  );
}

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

      if (isEnvironmentValueItem(value[0])) {
        return value.map(flattenEnvironmentValue).sort();
      }

      if ('name' in value[0]) {
        return value.map((item) =>
          typeof item === 'object' && item !== null && 'name' in item
            ? (item as { name: string }).name
            : item,
        );
      }
    }
    return value;
  }

  if (typeof value === 'object') {
    if (isEnvironmentValueItem(value)) {
      return flattenEnvironmentValue(value);
    }

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
    if (SKIP_AUDIT_KEYS.has(key)) {
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

  for (const key of SENSITIVE_KEYS) {
    const oldVal = before[key];
    const newVal = after[key];

    if (
      oldVal !== undefined &&
      newVal !== undefined &&
      oldVal !== newVal
    ) {
      diff[key] = { old: '********', new: 'Changed' };
    }
  }

  return diff;
}
