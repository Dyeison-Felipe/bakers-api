// shared/infra/cache/ttl-cache.ts
// Cache em memória com expiração por TTL e teto de entradas. Pensado para
// dados lidos com altíssima frequência e alterados raramente (ex.: usuário
// carregado pelo PermissionGuard a cada requisição). Instância única do
// processo — não compartilha estado entre réplicas.
type Entry<V> = { value: V; expiresAt: number };

export class TtlCache<V> {
  private readonly store = new Map<string, Entry<V>>();

  constructor(
    private readonly ttlMs: number,
    private readonly maxEntries: number,
  ) {}

  get(key: string): V | null {
    const entry = this.store.get(key);

    if (!entry) return null;

    if (entry.expiresAt <= Date.now()) {
      this.store.delete(key);
      return null;
    }

    return entry.value;
  }

  set(key: string, value: V): void {
    if (!this.store.has(key) && this.store.size >= this.maxEntries) {
      // Map preserva ordem de inserção: remove a entrada mais antiga.
      const oldestKey = this.store.keys().next().value;
      if (oldestKey !== undefined) this.store.delete(oldestKey);
    }

    this.store.set(key, { value, expiresAt: Date.now() + this.ttlMs });
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}
