type StoredObject = Record<string, unknown>;

export class LocalStorageStore<T extends StoredObject> {
  constructor(
    private readonly key: string,
    private readonly defaults: T,
  ) {}

  load(): T {
    const raw = this.storage?.getItem(this.key);
    if (!raw) {
      return { ...this.defaults };
    }

    try {
      const parsed = JSON.parse(raw) as Partial<T>;
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        return { ...this.defaults };
      }

      return { ...this.defaults, ...parsed };
    } catch {
      return { ...this.defaults };
    }
  }

  save(value: Partial<T>) {
    this.storage?.setItem(this.key, JSON.stringify({ ...this.defaults, ...value }));
  }

  remove() {
    this.storage?.removeItem(this.key);
  }

  private get storage() {
    return typeof localStorage === "undefined" ? null : localStorage;
  }
}
