"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "sgs-quote-theme";

function readInitialTheme() {
  if (typeof document === "undefined") {
    return "light";
  }
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

export function ThemeToggle() {
  const [theme, setTheme] = useState(readInitialTheme);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const nextTheme = stored === "dark" ? "dark" : "light";
    document.documentElement.dataset.theme = nextTheme;
    setTheme(nextTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = nextTheme;
    window.localStorage.setItem(STORAGE_KEY, nextTheme);
    setTheme(nextTheme);
  };

  return (
    <button
      type="button"
      className="theme-float-btn"
      onClick={toggleTheme}
      aria-label={theme === "light" ? "切换至夜间" : "切换至日间"}
    >
      <span className="theme-glyph" aria-hidden="true">
        {theme === "light" ? "夜" : "晨"}
      </span>
      <span>{theme === "light" ? "夜间" : "日间"}</span>
    </button>
  );
}
