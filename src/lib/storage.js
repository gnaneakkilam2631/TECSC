// Storage layer for the app's data.
//
// Right now this reads/writes the browser's localStorage, so everything
// lives on the one computer/browser you use. That's fine to develop and
// test with. Once you're ready for your father and staff to use this from
// different devices, swap the two functions below for calls to a real
// backend (Firebase, Supabase, or your own small API) — nothing else in
// the app needs to change, since every component only calls storeGet/storeSet.

const PREFIX = "shop-manager:";

export async function storeGet(key, fallback) {
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    console.error("storage get failed", e);
    return fallback;
  }
}

export async function storeSet(key, value) {
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch (e) {
    console.error("storage set failed", e);
  }
}
