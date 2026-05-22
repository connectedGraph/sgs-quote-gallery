"use client";

import { useEffect, useRef } from "react";

const STORAGE_KEY = "sgs-quote-views";

export function ViewTracker({ hero, skin }) {
  const lastKeyRef = useRef("");

  useEffect(() => {
    if (!hero || !skin) return;
    const key = `${hero}::${skin}`;
    if (lastKeyRef.current === key) return;
    lastKeyRef.current = key;

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const map = raw ? JSON.parse(raw) : {};
      const prev = map[key];
      const count = prev && typeof prev.count === "number" ? prev.count : 0;
      map[key] = { count: count + 1, lastViewed: Date.now() };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
    } catch (_error) {
      // ignore quota / privacy mode failures
    }
  }, [hero, skin]);

  return null;
}
