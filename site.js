(() => {
  const root = document.documentElement;
  const button = document.querySelector('.theme-toggle');
  const themeColor = document.querySelector('meta[name="theme-color"]');
  if (!button) return;

  function sync() {
    const dark = root.dataset.theme !== 'light';
    button.textContent = dark ? 'light' : 'dark';
    button.setAttribute('aria-label', `Switch to ${dark ? 'light' : 'dark'} theme`);
    if (themeColor) themeColor.content = dark ? '#191b1a' : '#f6f5f0';
  }

  sync();
  button.hidden = false;
  button.addEventListener('click', () => {
    root.dataset.theme = root.dataset.theme === 'light' ? 'dark' : 'light';
    try { localStorage.setItem('praneeth-theme', root.dataset.theme); } catch {}
    sync();
    root.dispatchEvent(new Event('themechange'));
  });
})();
