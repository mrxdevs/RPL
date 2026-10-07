/**
 * dataMerge.ts
 *
 * Merges incoming API lists with existing client-side state by item ID.
 * Prevents list items from flickering, disappearing, or fluctuating downwards
 * when background periodic polling hits stateless/ephemeral serverless runtimes.
 */

export function mergeListsById<T extends { id: string }>(
  existing: T[],
  incoming: T[],
  deletedIds: Set<string> | string[] = []
): T[] {
  if (!incoming && !existing) return [];
  const deletedSet = deletedIds instanceof Set ? deletedIds : new Set(deletedIds);
  const map = new Map<string, T>();

  // 1. Seed map with existing items (excluding explicitly deleted ones)
  for (const item of existing || []) {
    if (item && item.id && !deletedSet.has(item.id)) {
      map.set(item.id, item);
    }
  }

  // 2. Merge incoming items (overlaying latest properties and adding new items)
  for (const item of incoming || []) {
    if (item && item.id && !deletedSet.has(item.id)) {
      const current = map.get(item.id);
      if (current) {
        map.set(item.id, { ...current, ...item });
      } else {
        map.set(item.id, item);
      }
    }
  }

  return Array.from(map.values());
}
