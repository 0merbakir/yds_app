// IndexedDB utility for YDS App
// Replaces localStorage for streak data so progress survives cache clears.

const DB_NAME = 'yds_progress';
const DB_VERSION = 1;
const STORE_NAME = 'streaks';

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        // key: "categoryId", value: { [word]: streak }
        db.createObjectStore(STORE_NAME, { keyPath: 'categoryId' });
      }
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = (e) => reject(e.target.error);
  });
}

/** Read streak map for a given category. Returns {} if not found. */
export async function loadStreaks(categoryId) {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).get(categoryId);
      req.onsuccess = () => resolve(req.result?.streakMap || {});
      req.onerror = () => resolve({});
    });
  } catch {
    // Fallback to localStorage if IndexedDB unavailable
    const saved = localStorage.getItem(`yds_streaks_${categoryId}`);
    return saved ? JSON.parse(saved) : {};
  }
}

/** Persist streak map for a given category. */
export async function saveStreaks(categoryId, streakMap) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put({ categoryId, streakMap });
      tx.oncomplete = resolve;
      tx.onerror = (e) => reject(e.target.error);
    });
  } catch {
    // Fallback to localStorage
    localStorage.setItem(`yds_streaks_${categoryId}`, JSON.stringify(streakMap));
  }
}

/** Clear streaks for a category (used on reset). */
export async function clearStreaks(categoryId) {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(categoryId);
      tx.oncomplete = resolve;
      tx.onerror = resolve; // ignore errors on clear
    });
  } catch {
    localStorage.removeItem(`yds_streaks_${categoryId}`);
  }
}

/** Load streaks for ALL categories at once (for GlobalStats). */
export async function loadAllStreaks(categoryIds) {
  try {
    const db = await openDB();
    const results = {};
    await Promise.all(
      categoryIds.map(
        (id) =>
          new Promise((resolve) => {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const req = tx.objectStore(STORE_NAME).get(id);
            req.onsuccess = () => {
              results[id] = req.result?.streakMap || {};
              resolve();
            };
            req.onerror = () => {
              results[id] = {};
              resolve();
            };
          })
      )
    );
    return results;
  } catch {
    // Fallback: read from localStorage
    const results = {};
    categoryIds.forEach((id) => {
      const saved = localStorage.getItem(`yds_streaks_${id}`);
      results[id] = saved ? JSON.parse(saved) : {};
    });
    return results;
  }
}

/**
 * One-time migration: if localStorage has streak data and IndexedDB doesn't,
 * copy it over so existing users don't lose progress.
 */
export async function migrateFromLocalStorage(categoryIds) {
  try {
    const db = await openDB();
    for (const id of categoryIds) {
      const lsKey = `yds_streaks_${id}`;
      const lsData = localStorage.getItem(lsKey);
      if (!lsData) continue;

      // Only migrate if IndexedDB entry doesn't exist yet
      const existing = await new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const req = tx.objectStore(STORE_NAME).get(id);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(null);
      });

      if (!existing) {
        const streakMap = JSON.parse(lsData);
        await new Promise((resolve) => {
          const tx = db.transaction(STORE_NAME, 'readwrite');
          tx.objectStore(STORE_NAME).put({ categoryId: id, streakMap });
          tx.oncomplete = resolve;
          tx.onerror = resolve;
        });
        // Clean up localStorage after migration
        localStorage.removeItem(lsKey);
      }
    }
  } catch {
    // Migration failed silently — localStorage fallback still works
  }
}
