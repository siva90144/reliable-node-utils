export interface UniqueValueStore {
  has(value: string): boolean | Promise<boolean>;
  add(value: string): void | Promise<void>;
}

export class InMemoryUniqueValueStore implements UniqueValueStore {
  private readonly values = new Set<string>();

  has(value: string): boolean {
    return this.values.has(value);
  }

  add(value: string): void {
    this.values.add(value);
  }
}

const scopedStores = new Map<string, InMemoryUniqueValueStore>();

export function getScopedInMemoryStore(scope: string): InMemoryUniqueValueStore {
  const existing = scopedStores.get(scope);
  if (existing) return existing;
  const created = new InMemoryUniqueValueStore();
  scopedStores.set(scope, created);
  return created;
}

export function clearScopedInMemoryStores(): void {
  scopedStores.clear();
}
