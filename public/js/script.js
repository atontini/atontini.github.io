(() => {
  'use strict';
  const control = document.querySelector('.theme-control');
  const select = document.querySelector('#theme');
  if (!control || !select) return;

  select.value = document.documentElement.dataset.theme || 'system';
  control.hidden = false;
  select.addEventListener('change', () => {
    const theme = select.value;
    if (theme === 'system') delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = theme;
    try {
      if (theme === 'system') localStorage.removeItem('theme');
      else localStorage.setItem('theme', theme);
    } catch (error) { /* The selected theme still works without storage. */ }
  });
})();
