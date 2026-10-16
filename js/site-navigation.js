(() => {
  const hamburger = document.getElementById('hamburger');
  const drawer = document.getElementById('mobileDrawer');
  const overlay = document.getElementById('drawerOverlay');
  const close = document.getElementById('drawerClose');

  function closeDrawer() {
    if (drawer) drawer.classList.remove('open');
    if (overlay) overlay.classList.remove('visible');
    if (hamburger) hamburger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }
  function openDrawer() {
    if (!drawer || !overlay) return;
    drawer.classList.add('open');
    overlay.classList.add('visible');
    if (hamburger) hamburger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }
  if (hamburger) hamburger.addEventListener('click', () => {
    drawer && drawer.classList.contains('open') ? closeDrawer() : openDrawer();
  });
  if (close) close.addEventListener('click', closeDrawer);
  if (overlay) overlay.addEventListener('click', closeDrawer);
  if (drawer) drawer.querySelectorAll('a').forEach(link => link.addEventListener('click', closeDrawer));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeDrawer();
  });

  window.copySupportId = async function(value) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(value);
      } else {
        const field = document.createElement('textarea');
        field.value = value;
        field.setAttribute('readonly', '');
        field.style.position = 'fixed';
        field.style.opacity = '0';
        document.body.appendChild(field);
        field.select();
        const copied = document.execCommand('copy');
        field.remove();
        if (!copied) throw new Error('Copy unavailable');
      }
      const button = document.querySelector('.btn-copy-support');
      if (button) {
        const old = button.textContent;
        button.textContent = '✓ کپی شد';
        window.setTimeout(() => { button.textContent = old; }, 1800);
      }
    } catch {
      window.prompt('آیدی را کپی کنید:', value);
    }
  };

  const check = document.getElementById('confirmCheck');
  const continueLink = document.getElementById('guideContinue');
  if (check && continueLink) {
    const update = () => {
      const enabled = check.checked;
      continueLink.setAttribute('aria-disabled', String(!enabled));
      continueLink.classList.toggle('is-disabled', !enabled);
      continueLink.tabIndex = enabled ? 0 : -1;
    };
    check.addEventListener('change', update);
    continueLink.addEventListener('click', event => {
      if (!check.checked) event.preventDefault();
    });
    update();
  }
})();