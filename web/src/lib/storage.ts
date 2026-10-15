/**
 * A tiny external store over localStorage, read with useSyncExternalStore so the server render
 * (no storage) and the first client render agree, and every component sees the same value.
 */
export function createLocalStore<T>(key: string, fallback: T, validate: (raw: unknown) => T) {
  let cache: T | undefined;
  const listeners = new Set<() => void>();

  const read = (): T => {
    if (cache !== undefined) return cache;
    try {
      const raw = window.localStorage.getItem(key);
      cache = raw ? validate(JSON.parse(raw)) : fallback;
    } catch {
      cache = fallback; // private mode or corrupted data: start fresh
    }
    return cache;
  };

  return {
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getSnapshot: read,
    getServerSnapshot: () => fallback,
    update(fn: (prev: T) => T) {
      cache = fn(read());
      try {
        window.localStorage.setItem(key, JSON.stringify(cache));
      } catch {
        // storage unavailable: keep the in-memory value for this session
      }
      listeners.forEach((l) => l());
    },
  };
}

const noop = () => () => {};
/** True only after hydration on the client; lets components skip a server/client mismatch. */
export const hydrationStore = {
  subscribe: noop,
  getSnapshot: () => true,
  getServerSnapshot: () => false,
};
