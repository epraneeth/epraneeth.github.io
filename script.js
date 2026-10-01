const toggle = document.querySelector('#theme-toggle');
const root = document.documentElement;
const preferredTheme = matchMedia('(prefers-color-scheme: dark)');
let explicitTheme;

try { explicitTheme = localStorage.getItem('theme'); } catch (_) { /* Storage can be disabled. */ }

function syncThemeLabel() {
  if (!toggle) return;
  const dark = root.dataset.theme === 'dark';
  toggle.textContent = dark ? 'light' : 'dark';
  toggle.setAttribute('aria-label', `Switch to ${dark ? 'light' : 'dark'} theme`);
  toggle.setAttribute('aria-pressed', String(dark));
}

if (toggle) {
  toggle.hidden = false;
  syncThemeLabel();
  toggle.addEventListener('click', () => {
    explicitTheme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    root.dataset.theme = explicitTheme;
    try { localStorage.setItem('theme', explicitTheme); } catch (_) { /* Theme still works in memory. */ }
    syncThemeLabel();
  });
}

preferredTheme.addEventListener('change', (event) => {
  if (explicitTheme === 'light' || explicitTheme === 'dark') return;
  root.dataset.theme = event.matches ? 'dark' : 'light';
  syncThemeLabel();
});
