(() => {
  const grid = document.getElementById('productGrid');
  if (!grid) return;
  const marketplaces = [
    { label: 'ترب', url: q => 'https://torob.com/search/?query=' + encodeURIComponent(q), cls: 'torob' },
    { label: 'دیجی‌کالا', url: q => 'https://www.digikala.com/search/?q=' + encodeURIComponent(q), cls: 'digikala' },
    { label: 'باسلام', url: q => 'https://basalam.com/search?query=' + encodeURIComponent(q), cls: 'basalam' }
  ];
  function addLinks() {
    grid.querySelectorAll('.product-card').forEach(card => {
      if (card.querySelector('.product-market-links')) return;
      const title = card.querySelector('.product-title')?.textContent?.trim();
      const foot = card.querySelector('.product-foot');
      if (!title || !foot) return;
      const wrap = document.createElement('div');
      wrap.className = 'product-market-links';
      const caption = document.createElement('span');
      caption.textContent = 'بررسی این مدل در:';
      wrap.append(caption);
      marketplaces.forEach(market => {
        const link = document.createElement('a');
        link.href = market.url(title);
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.className = market.cls;
        link.textContent = market.label;
        link.setAttribute('aria-label', 'جست‌وجوی ' + title + ' در ' + market.label);
        wrap.append(link);
      });
      foot.before(wrap);
    });
  }
  new MutationObserver(addLinks).observe(grid, { childList: true, subtree: true });
  addLinks();
})();