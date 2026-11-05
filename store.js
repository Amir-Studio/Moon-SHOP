import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

(() => {
  const SUPABASE_URL = 'https://oolfbjxclhzlbwjmzxxx.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_Q_eVY-Arb4hZQudDYrwy0Q_TbrUGAIv';
  const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

  const grid = document.getElementById('productGrid');
  const search = document.getElementById('searchInput');
  const sort = document.getElementById('sortSelect');
  const count = document.getElementById('resultCount');
  const rateValue = document.getElementById('rateValue');
  const rateStamp = document.getElementById('rateStamp');
  const rateStatus = document.getElementById('rateStatus');
  const cartDrawer = document.getElementById('cartDrawer');
  const cartItems = document.getElementById('cartItems');
  const cartCount = document.getElementById('cartCount');
  const cartTotal = document.getElementById('cartTotal');
  const cartButton = document.getElementById('cartButton');
  const cartClose = document.getElementById('cartClose');
  const menuToggle = document.getElementById('menuToggle');
  const nav = document.getElementById('mainNav');

  let products = [];
  let activeCategory = 'all';
  let cart = [];
  const fa = n => Number(n || 0).toLocaleString('fa-IR');
  const money = n => Math.round(Number(n || 0)).toLocaleString('fa-IR') + ' تومان';

  function setConnection(ok, message) {
    rateStatus.textContent = message;
    const dot = rateStatus.parentElement.querySelector('i');
    if (dot) dot.style.background = ok ? '#9dd6b1' : '#d6b18a';
  }

  function getCart() {
    try {
      cart = JSON.parse(localStorage.getItem('moonDigitalCart') || '[]');
      if (!Array.isArray(cart)) cart = [];
    } catch (e) { cart = []; }
  }

  function saveCart() {
    try { localStorage.setItem('moonDigitalCart', JSON.stringify(cart)); } catch (e) {}
    renderCart();
  }

  function productCard(p) {
    const article = document.createElement('article');
    article.className = 'product-card';

    const visual = document.createElement('div');
    visual.className = 'product-visual';
    if (p.imageUrl) {
      const image = document.createElement('img');
      image.className = 'product-image';
      image.src = p.imageUrl;
      image.alt = p.name;
      image.loading = 'lazy';
      image.decoding = 'async';
      image.onerror = () => {
        image.remove();
        const fallback = document.createElement('div');
        fallback.className = 'product-symbol';
        fallback.textContent = p.symbol || 'MOON';
        visual.append(fallback);
      };
      visual.append(image);
    } else {
      const fallback = document.createElement('div');
      fallback.className = 'product-symbol';
      fallback.textContent = p.symbol || 'MOON';
      visual.append(fallback);
    }

    const tag = document.createElement('span');
    tag.className = 'product-tag';
    tag.textContent = p.categoryLabel || 'محصول';
    const code = document.createElement('span');
    code.className = 'product-code';
    code.textContent = 'MOON / ' + String(p.id).padStart(3, '0');
    visual.append(tag, code);

    const body = document.createElement('div');
    body.className = 'product-body';
    const title = document.createElement('h3');
    title.className = 'product-title';
    title.textContent = p.name;
    const desc = document.createElement('p');
    desc.className = 'product-desc';
    desc.textContent = p.description || '';

    const stock = document.createElement('small');
    stock.className = 'product-stock';
    stock.textContent = p.stock > 0 ? 'موجودی ثبت‌شده: ' + fa(p.stock) + ' عدد' : 'ناموجود';

    const price = document.createElement('div');
    price.className = 'product-price';
    const amount = document.createElement('strong');
    amount.className = 'usd';
    amount.textContent = money(p.price);
    const currencyLabel = document.createElement('div');
    currencyLabel.className = 'irr';
    currencyLabel.textContent = 'قیمت ثبت‌شده';
    price.append(amount, currencyLabel);

    const foot = document.createElement('div');
    foot.className = 'product-foot';
    const add = document.createElement('button');
    add.className = 'btn primary';
    add.type = 'button';
    add.textContent = 'افزودن به سبد +';
    add.disabled = p.stock <= 0;
    add.addEventListener('click', () => addToCart(p.id));
    foot.append(add);

    body.append(title, desc, stock, price, foot);
    article.append(visual, body);
    return article;
  }

  function render() {
    const q = search.value.trim().toLocaleLowerCase('fa');
    let list = products.filter(p =>
      (activeCategory === 'all' || p.category === activeCategory) &&
      (p.name + ' ' + p.description + ' ' + p.categoryLabel).toLocaleLowerCase('fa').includes(q)
    );

    if (sort.value === 'low') list.sort((a, b) => a.price - b.price);
    if (sort.value === 'high') list.sort((a, b) => b.price - a.price);
    if (sort.value === 'name') list.sort((a, b) => a.name.localeCompare(b.name, 'fa'));

    count.textContent = fa(list.length) + ' کالا از ' + fa(products.length);
    grid.replaceChildren();
    if (!list.length) {
      const empty = document.createElement('div');
      empty.className = 'empty';
      empty.textContent = products.length ? 'کالایی با این مشخصات پیدا نشد.' : 'هنوز محصول فعالی در کاتالوگ ثبت نشده است.';
      grid.append(empty);
      return;
    }
    list.forEach(p => grid.append(productCard(p)));
  }

  function addToCart(id) {
    const product = products.find(x => x.id === id);
    if (!product) return;
    const item = cart.find(x => x.id === id);
    const current = item ? Number(item.qty) || 0 : 0;
    if (current >= product.stock) {
      alert('تعداد انتخاب‌شده به سقف موجودی ثبت‌شده رسیده است.');
      return;
    }
    if (item) item.qty = current + 1;
    else cart.push({ id, qty: 1 });
    saveCart();
    cartDrawer.classList.add('open');
  }

  function changeCartQty(id, delta) {
    const item = cart.find(x => x.id === id);
    const product = products.find(x => x.id === id);
    if (!item || !product) return;
    const next = (Number(item.qty) || 0) + delta;
    if (next <= 0) cart = cart.filter(x => x.id !== id);
    else if (next > product.stock) {
      alert('بیشتر از موجودی ثبت‌شده نمی‌توان انتخاب کرد.');
      return;
    } else item.qty = next;
    saveCart();
  }

  function renderCart() {
    if (!cartItems) return;
    cartItems.replaceChildren();
    let total = 0;
    let qty = 0;
    cart = cart.filter(row => products.some(p => p.id === row.id) && Number(row.qty) > 0);

    cart.forEach(row => {
      const p = products.find(x => x.id === row.id);
      if (!p) return;
      const itemQty = Math.min(Number(row.qty) || 1, p.stock);
      row.qty = itemQty;
      if (!itemQty) return;
      const lineTotal = p.price * itemQty;
      total += lineTotal;
      qty += itemQty;

      const item = document.createElement('div');
      item.className = 'cart-item';
      const info = document.createElement('div');
      info.className = 'cart-item-info';
      const title = document.createElement('b');
      title.textContent = p.name;
      const price = document.createElement('small');
      price.textContent = money(lineTotal);
      const stock = document.createElement('small');
      stock.className = 'cart-stock-note';
      stock.textContent = 'موجودی ثبت‌شده: ' + fa(p.stock) + ' عدد';
      info.append(title, price, stock);

      const controls = document.createElement('div');
      controls.className = 'cart-qty';
      const minus = document.createElement('button');
      minus.type = 'button';
      minus.textContent = '−';
      minus.setAttribute('aria-label', 'کم کردن تعداد ' + p.name);
      minus.addEventListener('click', () => changeCartQty(row.id, -1));
      const amount = document.createElement('span');
      amount.textContent = fa(itemQty);
      const plus = document.createElement('button');
      plus.type = 'button';
      plus.textContent = '+';
      plus.disabled = itemQty >= p.stock;
      plus.setAttribute('aria-label', 'زیاد کردن تعداد ' + p.name);
      plus.addEventListener('click', () => changeCartQty(row.id, 1));
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'cart-remove';
      remove.textContent = 'حذف';
      remove.addEventListener('click', () => {
        cart = cart.filter(x => x.id !== row.id);
        saveCart();
      });
      controls.append(minus, amount, plus);
      item.append(info, controls, remove);
      cartItems.append(item);
    });

    if (!qty) {
      const empty = document.createElement('p');
      empty.className = 'empty';
      empty.textContent = 'سبد خریدت هنوز خالی است.';
      cartItems.append(empty);
    }
    cartCount.textContent = fa(qty);
    cartTotal.textContent = money(total);
  }

  async function loadProducts() {
    setConnection(false, 'در حال اتصال به کاتالوگ…');
    grid.textContent = 'در حال دریافت محصولات از پایگاه داده…';
    const { data, error } = await supabase
      .from('products')
      .select('id,name,description,price,currency,image_url,stock,category,category_label,symbol')
      .eq('is_active', true)
      .order('id', { ascending: true });

    if (error) {
      console.error('Supabase products error:', error);
      setConnection(false, 'خطا در اتصال به پایگاه داده');
      grid.textContent = 'دریافت محصولات ناموفق بود. تنظیمات اتصال و دسترسی خواندن جدول را بررسی کن.';
      count.textContent = 'خطا در دریافت کاتالوگ';
      return;
    }

    products = (data || []).map(row => ({
      id: Number(row.id),
      name: row.name || '',
      description: row.description || '',
      price: Number(row.price) || 0,
      currency: row.currency || 'TOMAN',
      imageUrl: row.image_url || '',
      stock: Math.max(0, Number(row.stock) || 0),
      category: row.category || 'other',
      categoryLabel: row.category_label || 'سایر',
      symbol: row.symbol || 'MOON'
    })).filter(p => p.currency === 'TOMAN');

    rateValue.textContent = fa(products.length) + ' کالا';
    rateStamp.textContent = 'کاتالوگ زنده از Supabase';
    setConnection(true, 'پایگاه داده متصل است');
    render();
    renderCart();
  }

  document.querySelectorAll('.category').forEach(btn => btn.addEventListener('click', () => {
    activeCategory = btn.dataset.category;
    document.querySelectorAll('.category').forEach(x => x.classList.toggle('active', x === btn));
    render();
  }));
  search.addEventListener('input', render);
  sort.addEventListener('change', render);
  cartButton.addEventListener('click', e => { e.preventDefault(); cartDrawer.classList.add('open'); });
  cartClose.addEventListener('click', () => cartDrawer.classList.remove('open'));
  cartDrawer.addEventListener('click', e => { if (e.target === cartDrawer) cartDrawer.classList.remove('open'); });
  menuToggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', String(open));
  });
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    nav.classList.remove('open');
    menuToggle.setAttribute('aria-expanded', 'false');
  }));

  getCart();
  renderCart();
  loadProducts();
})();
