(function applyOKLabPaletteToCSS() {
  if (!window.racerColors || !Array.isArray(window.racerColors)) return;
  const root = document.documentElement;
  for (let i = 0; i < window.racerColors.length; i++) {
    root.style.setProperty(`--racer-color-${i}`, window.racerColors[i]);
  }
})();

