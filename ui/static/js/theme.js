/**
 * theme.js — Shared Dark/Light Mode Toggle
 * Included in every page. Applies before render to avoid flash.
 */

(function () {
  const STORAGE_KEY = "itsTheme";

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    const btn = document.getElementById("theme-toggle");
    if (btn) btn.textContent = theme === "dark" ? "☀️" : "🌙";
  }

  // Apply saved theme immediately (before DOM paint)
  const saved = localStorage.getItem(STORAGE_KEY) || "light";
  applyTheme(saved);

  // Expose toggle function globally
  window.toggleTheme = function () {
    const current = document.documentElement.getAttribute("data-theme") || "light";
    const next = current === "dark" ? "light" : "dark";
    localStorage.setItem(STORAGE_KEY, next);
    applyTheme(next);
  };
})();
