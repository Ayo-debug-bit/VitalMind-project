class SafeStorage {
  private memoryStore: Record<string, string> = {};
  private isAvailable: boolean;
  private type: 'local' | 'session';

  constructor(type: 'local' | 'session') {
    this.type = type;
    try {
      const testKey = '__storage_test__';
      const storage = typeof window !== 'undefined' ? (type === 'local' ? window.localStorage : window.sessionStorage) : null;
      if (storage) {
        storage.setItem(testKey, testKey);
        storage.removeItem(testKey);
        this.isAvailable = true;
      } else {
        this.isAvailable = false;
      }
    } catch (e) {
      this.isAvailable = false;
      console.warn(`${type}Storage is blocked or not available in this environment. Falling back to in-memory storage.`, e);
    }
  }

  getItem(key: string): string | null {
    if (this.isAvailable && typeof window !== 'undefined') {
      try {
        const storage = this.type === 'local' ? window.localStorage : window.sessionStorage;
        return storage.getItem(key);
      } catch (e) {
        // Fallback to memory
      }
    }
    return key in this.memoryStore ? this.memoryStore[key] : null;
  }

  setItem(key: string, value: string): void {
    if (this.isAvailable && typeof window !== 'undefined') {
      try {
        const storage = this.type === 'local' ? window.localStorage : window.sessionStorage;
        storage.setItem(key, value);
        return;
      } catch (e) {
        // Fallback to memory
      }
    }
    this.memoryStore[key] = String(value);
  }

  removeItem(key: string): void {
    if (this.isAvailable && typeof window !== 'undefined') {
      try {
        const storage = this.type === 'local' ? window.localStorage : window.sessionStorage;
        storage.removeItem(key);
        return;
      } catch (e) {
        // Fallback to memory
      }
    }
    delete this.memoryStore[key];
  }

  clear(): void {
    if (this.isAvailable && typeof window !== 'undefined') {
      try {
        const storage = this.type === 'local' ? window.localStorage : window.sessionStorage;
        storage.clear();
        return;
      } catch (e) {
        // Fallback to memory
      }
    }
    this.memoryStore = {};
  }
}

export const safeLocalStorage = new SafeStorage('local');
export const safeSessionStorage = new SafeStorage('session');
export const safeStorage = safeLocalStorage;

