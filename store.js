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
      grid.textContent = 'خطای Supabase: ' + (error.message || 'خطای نامشخص') + (error.code ? ' | کد: ' + error.code : '') + (error.details ? ' | جزئیات: ' + error.details : '');
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


/* Category tiles + secure in-page administration */
(() => {
  document.querySelectorAll('.category-tile').forEach(tile => tile.addEventListener('click', () => {
    const category = tile.dataset.category;
    const filter = document.querySelector('.category[data-category="' + category + '"]');
    if (filter) filter.click();
    document.getElementById('products')?.scrollIntoView({behavior:'smooth'});
  }));

  const SUPABASE_URL = 'https://oolfbjxclhzlbwjmzxxx.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_Q_eVY-Arb4hZQudDYrwy0Q_TbrUGAIv';
  const client = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
  const $ = id => document.getElementById(id);
  const loginView = $('loginView'), adminView = $('adminView');
  const loginForm = $('loginForm'), loginMessage = $('loginMessage');
  const body = $('productsBody'), workspaceMessage = $('workspaceMessage');
  const modal = $('productModal'), productForm = $('productForm');
  if (!loginForm || !adminView) return;
  let adminProducts = [];

  const fa = value => Number(value || 0).toLocaleString('fa-IR');
  const toman = value => fa(value) + ' تومان';
  const categoryLabel = value => ({charging:'شارژ و برق',peripherals:'لوازم جانبی',connectivity:'اتصال و تبدیل',other:'سایر'})[value] || 'سایر';
  function note(el, value, success=false) {
    el.textContent = value;
    el.classList.toggle('success', success);
  }
  function showAdmin() { loginView.classList.add('hidden'); adminView.classList.remove('hidden'); }
  function showLogin() { adminView.classList.add('hidden'); loginView.classList.remove('hidden'); }
  async function verifyAdmin() {
    const {data:{session}} = await client.auth.getSession();
    if (!session) { showLogin(); return; }
    const {data,error} = await client.from('admin_users').select('user_id').eq('user_id',session.user.id).maybeSingle();
    if (error || !data) {
      await client.auth.signOut();
      showLogin();
      note(loginMessage, 'این حساب دسترسی مدیر ندارد.');
      return;
    }
    showAdmin();
    await loadAdminProducts();
  }
  loginForm.addEventListener('submit', async event => {
    event.preventDefault();
    const button = $('loginButton'); button.disabled = true;
    note(loginMessage, 'در حال بررسی اطلاعات…');
    const {error} = await client.auth.signInWithPassword({email:$('email').value.trim(),password:$('password').value});
    button.disabled = false;
    if (error) { note(loginMessage, 'ورود ناموفق بود: ' + error.message); return; }
    await verifyAdmin();
  });
  $('logoutButton').addEventListener('click', async () => {
    await client.auth.signOut(); showLogin(); note(loginMessage, 'از حساب خارج شدید.', true);
  });
  async function loadAdminProducts() {
    body.innerHTML = '<tr><td colspan="5">در حال دریافت اطلاعات…</td></tr>';
    const {data,error} = await client.from('products')
      .select('id,name,description,price,currency,image_url,stock,is_active,category,category_label,symbol')
      .order('id',{ascending:true});
    if (error) { body.innerHTML = '<tr><td colspan="5"></td></tr>'; body.querySelector('td').textContent='خطا: '+error.message; note(workspaceMessage,'دریافت اطلاعات ناموفق بود.'); return; }
    adminProducts = data || [];
    $('totalCount').textContent = fa(adminProducts.length);
    $('activeCount').textContent = fa(adminProducts.filter(p=>p.is_active).length);
    $('stockCount').textContent = fa(adminProducts.reduce((sum,p)=>sum+Number(p.stock||0),0));
    renderAdminProducts();
    note(workspaceMessage,'اطلاعات به‌روز شد.',true);
  }
  function renderAdminProducts() {
    const query = $('adminSearchInput').value.trim().toLocaleLowerCase('fa');
    const list = adminProducts.filter(p => (p.name||'').toLocaleLowerCase('fa').includes(query));
    body.replaceChildren();
    if (!list.length) { const tr=document.createElement('tr'),td=document.createElement('td');td.colSpan=5;td.textContent='محصولی پیدا نشد.';tr.append(td);body.append(tr);return; }
    list.forEach(p => {
      const tr=document.createElement('tr');
      const name=document.createElement('td'); name.textContent=p.name;
      const price=document.createElement('td'); price.textContent=toman(p.price);
      const stock=document.createElement('td'); stock.textContent=fa(p.stock);
      const status=document.createElement('td'); const pill=document.createElement('span');pill.className='pill'+(p.is_active?'':' inactive');pill.textContent=p.is_active?'فعال':'غیرفعال';status.append(pill);
      const actions=document.createElement('td');
      const edit=document.createElement('button');edit.textContent='ویرایش';edit.addEventListener('click',()=>openEditor(p));
      const toggle=document.createElement('button');toggle.textContent=p.is_active?'مخفی‌کردن':'فعال‌کردن';toggle.addEventListener('click',()=>toggleAdminProduct(p));
      const del=document.createElement('button');del.className='delete';del.textContent='حذف';del.addEventListener('click',()=>deleteAdminProduct(p));
      actions.append(edit,toggle,del);tr.append(name,price,stock,status,actions);body.append(tr);
    });
  }
  function openEditor(p=null) {
    productForm.reset();
    $('productId').value=p?.id ?? '';
    $('modalTitle').textContent=p?'ویرایش محصول':'افزودن محصول';
    $('productName').value=p?.name||'';
    $('productDescription').value=p?.description||'';
    $('productPrice').value=p?.price??'';
    $('productStock').value=p?.stock??0;
    $('productImage').value=p?.image_url||'';
    $('productCategory').value=p?.category||'other';
    $('productSymbol').value=p?.symbol||'MOON';
    $('productActive').checked=p?Boolean(p.is_active):true;
    note($('formMessage'),'');
    modal.classList.remove('hidden');
  }
  function closeEditor(){modal.classList.add('hidden');}
  $('addButton').addEventListener('click',()=>openEditor());
  $('closeModal').addEventListener('click',closeEditor);
  $('cancelButton').addEventListener('click',closeEditor);
  modal.addEventListener('click',event=>{if(event.target===modal)closeEditor();});
  $('adminSearchInput').addEventListener('input',renderAdminProducts);
  $('refreshButton').addEventListener('click',loadAdminProducts);
  productForm.addEventListener('submit',async event=>{
    event.preventDefault();
    const id=$('productId').value;
    const category=$('productCategory').value;
    const payload={
      name:$('productName').value.trim(),
      description:$('productDescription').value.trim()||null,
      price:Number($('productPrice').value),
      currency:'TOMAN',
      stock:Number($('productStock').value),
      image_url:$('productImage').value.trim()||null,
      category,category_label:categoryLabel(category),
      symbol:$('productSymbol').value.trim()||'MOON',
      is_active:$('productActive').checked
    };
    if(!payload.name||!Number.isFinite(payload.price)||payload.price<0||!Number.isInteger(payload.stock)||payload.stock<0){note($('formMessage'),'نام، قیمت و موجودی را بررسی کن.');return;}
    const button=$('saveButton');button.disabled=true;button.textContent='در حال ذخیره…';
    const result=id?await client.from('products').update(payload).eq('id',id):await client.from('products').insert(payload);
    button.disabled=false;button.textContent='ذخیره محصول';
    if(result.error){note($('formMessage'),'ذخیره انجام نشد: '+result.error.message);return;}
    closeEditor();await loadAdminProducts();
  });
  async function toggleAdminProduct(p){
    const {error}=await client.from('products').update({is_active:!p.is_active}).eq('id',p.id);
    if(error){note(workspaceMessage,'تغییر وضعیت ناموفق بود: '+error.message);return;}
    await loadAdminProducts();
  }
  async function deleteAdminProduct(p){
    if(!confirm('محصول «'+p.name+'» حذف شود؟'))return;
    const {error}=await client.from('products').delete().eq('id',p.id);
    if(error){note(workspaceMessage,'حذف ناموفق بود: '+error.message);return;}
    await loadAdminProducts();
  }
  document.addEventListener('keydown',event=>{if(event.key==='Escape'){closeEditor();document.getElementById('cartDrawer')?.classList.remove('open');}});
  verifyAdmin();
})();
