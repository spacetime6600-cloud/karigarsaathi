/**
 * Shared Firestore Utilities for KarigarSaathi
 * Provides safe write-boundary sanitisation and development diagnostic helpers.
 */

/**
 * Safe Firestore write-boundary utility.
 * Recursively strips undefined values from plain objects and arrays
 * without corrupting Date, Timestamp, FieldValue, DocumentReference or other class instances.
 */
export function removeUndefinedDeep<T>(value: T): T {
  if (Array.isArray(value)) {
    return value
      .filter((item) => item !== undefined)
      .map((item) => removeUndefinedDeep(item)) as unknown as T;
  }

  if (
    value !== null &&
    typeof value === 'object' &&
    Object.getPrototypeOf(value) === Object.prototype
  ) {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, item]) => item !== undefined)
        .map(([key, item]) => [key, removeUndefinedDeep(item)])
    ) as unknown as T;
  }

  return value;
}

/**
 * Development-only diagnostic helper that reports undefined paths in an object tree.
 */
export function findUndefinedPaths(
  value: unknown,
  path = 'root',
  output: string[] = []
): string[] {
  if (value === undefined) {
    output.push(path);
    return output;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      findUndefinedPaths(item, `${path}[${index}]`, output)
    );
  } else if (
    value !== null &&
    typeof value === 'object' &&
    Object.getPrototypeOf(value) === Object.prototype
  ) {
    Object.entries(value).forEach(([key, item]) =>
      findUndefinedPaths(item, `${path}.${key}`, output)
    );
  }

  return output;
}
