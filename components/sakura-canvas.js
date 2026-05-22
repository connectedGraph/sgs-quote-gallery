"use client";

import Script from "next/script";
import { useEffect } from "react";

export function SakuraCanvas() {
  useEffect(() => {
    const start = () => {
      if (typeof window !== "undefined" && typeof window.startSakura === "function") {
        window.startSakura();
      }
    };

    start();
  }, []);

  return (
    <Script
      src="/樱花散落.js"
      strategy="afterInteractive"
      onLoad={() => {
        if (typeof window !== "undefined" && typeof window.startSakura === "function") {
          window.startSakura();
        }
      }}
    />
  );
}
