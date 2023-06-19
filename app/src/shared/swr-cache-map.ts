export class CacheMap {
  _data: Map<string, any>;

  constructor(pairs: Array<[string, any]>) {
    this._data = new Map(
      pairs.map(([key, value]) => [
        key,
        { data: value, isValidating: false, isLoading: false },
      ]),
    );
  }

  has(key: string) {
    return this._data.has(key);
  }

  get(key: string) {
    return this._data.get(key);
  }

  set(key: string, value: any) {
    return this._data.set(key, value);
  }

  delete(key: string) {
    return this._data.delete(key);
  }

  keys() {
    return this._data.keys();
  }
}
