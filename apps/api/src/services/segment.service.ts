interface FilterRule {
  field: 'tag' | 'opted_in' | 'language';
  value: string | boolean;
}

/**
 * Resolves a segment's stored filter rules into the actual list of matching
 * contacts for a tenant. Rules are ANDed together. Supports the rule shape
 * produced by the Segments UI: { field: 'tag' | 'opted_in' | 'language', value }.
 */
export async function resolveSegmentContacts(db: any, tenantId: string, filters: unknown): Promise<any[]> {
  const rules = Array.isArray(filters) ? (filters as FilterRule[]) : [];

  let query = db.from('contacts').select('*').eq('tenant_id', tenantId);

  for (const rule of rules) {
    if (!rule?.field || rule.value === undefined || rule.value === '') continue;

    if (rule.field === 'opted_in') {
      query = query.eq('opted_in', rule.value === 'true' || rule.value === true);
    } else if (rule.field === 'language') {
      query = query.eq('language', rule.value);
    }
    // 'tag' is applied as a post-filter below since it lives in a join table.
  }

  const { data: contacts } = await query;
  let result: any[] = contacts || [];

  const tagRules = rules.filter((r) => r.field === 'tag' && r.value);
  if (tagRules.length > 0 && result.length > 0) {
    const { data: tagRows } = await db
      .from('contact_tags')
      .select('contact_id, tag')
      .in('contact_id', result.map((c) => c.id))
      .in('tag', tagRules.map((r) => r.value));

    const contactIdsWithTag = new Set((tagRows || []).map((t: any) => t.contact_id));
    result = result.filter((c) => contactIdsWithTag.has(c.id));
  }

  return result;
}
