"use client";

import { useState } from "react";
import Icon from "@/components/Icons";

type Theme = "light" | "dark";

// The choice lives in a cookie so the server renders the right theme on every page, with no flash.
export default function ThemeToggle({ initial }: { initial: Theme }) {
  const [theme, setTheme] = useState<Theme>(initial);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    document.cookie = `vl_theme=${next}; path=/; max-age=31536000; samesite=lax`;
  }

  const dark = theme === "dark";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Light mode" : "Dark mode"}
      className="flex h-10 w-10 items-center justify-center rounded-lg text-navy transition hover:bg-gold-soft"
    >
      <Icon name={dark ? "sun" : "moon"} className="h-5 w-5" />
    </button>
  );
}
