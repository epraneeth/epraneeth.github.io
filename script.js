const toggle = document.querySelector('#theme-toggle');
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') document.body.dataset.theme = 'dark';

function syncThemeLabel() {
  const dark = document.body.dataset.theme === 'dark';
  toggle.textContent = dark ? 'light' : 'dark';
  toggle.setAttribute('aria-label', `Switch to ${dark ? 'light' : 'dark'} theme`);
}

syncThemeLabel();
toggle.addEventListener('click', () => {
  document.body.dataset.theme = document.body.dataset.theme === 'dark' ? '' : 'dark';
  localStorage.setItem('theme', document.body.dataset.theme || 'light');
  syncThemeLabel();
});
