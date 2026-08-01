import { Request, Response, NextFunction } from 'express';

// JSONB columns whose contents are opaque structures (Meta template
// components, flow node graphs, campaign audience filters, arbitrary
// user-defined fields, etc.) - key casing inside these must be preserved
// exactly as stored, since it may need to round-trip back to Meta's API or
// was defined by the user/frontend itself.
const OPAQUE_KEYS = new Set([
  'custom_fields',
  'customFields',
  'filters',
  'components',
  'nodes',
  'edges',
  'variables',
  'payload',
  'features',
  'line_items',
  'lineItems',
  'metadata'
]);

function snakeToCamel(key: string): string {
  return key.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase());
}

/**
 * Recursively converts an object/array's keys from snake_case to camelCase,
 * preserving the contents of known opaque JSONB fields untouched. Shared by
 * the HTTP response middleware below and by Socket.IO emit call sites, so
 * every payload the frontend receives - over REST or over the socket - uses
 * the same casing the shared TypeScript types expect.
 */
export function toCamelCase(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(toCamelCase);
  }

  if (value !== null && typeof value === 'object' && !(value instanceof Date)) {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      const camelKey = snakeToCamel(key);
      // Preserve opaque JSONB payloads verbatim - only rename the column key
      // itself, don't recurse into its contents.
      result[camelKey] = OPAQUE_KEYS.has(key) ? val : toCamelCase(val);
    }
    return result;
  }

  return value;
}

/**
 * Converts every JSON response's object keys from snake_case (as returned by
 * Supabase, which mirrors the Postgres column names) to camelCase (as
 * declared by the shared TypeScript types the frontend is built against).
 * Without this, fields like waba_id/display_number/quality_rating are sent
 * as-is and show up as `undefined` in the UI, since the frontend reads
 * wabaId/displayNumber/qualityRating.
 */
export function camelCaseResponses(_req: Request, res: Response, next: NextFunction): void {
  const originalJson = res.json.bind(res);
  res.json = (body: unknown) => originalJson(toCamelCase(body));
  next();
}
