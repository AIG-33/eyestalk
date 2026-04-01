export const storageAdapter = {
  getItem: (key: string) => localStorage.getItem(key),
  setItem: (key: string, value: string) => localStorage.setItem(key, value),
  removeItem: (key: string) => localStorage.removeItem(key),
};

export const appStorage = {
  get: (key: string): Promise<string | null> => Promise.resolve(localStorage.getItem(key)),
  set: (key: string, value: string): Promise<void> => { localStorage.setItem(key, value); return Promise.resolve(); },
  remove: (key: string): Promise<void> => { localStorage.removeItem(key); return Promise.resolve(); },
};
