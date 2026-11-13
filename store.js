import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

(() => {
  const SUPABASE_URL = 'https://oolfbjxclhzlbwjmzxxx.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_Q_eVY-Arb4hZQudDYrwy0Q_TbrUGAIv';
  const db = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
  const $ = id => document.getElementById(id);
  const fa = n => Number(n || 0).toLocaleString('fa-IR');
  const money = n => Math.round(Number(n || 0)).toLocaleString('fa-IR') + ' تومان';
  const labels = {charging:'شارژ و برق',peripherals:'لوازم جانبی',connectivity:'اتصال و تبدیل',audio:'صوتی و تصویری',smart:'هوشمند و پوشیدنی',storage:'حافظه و ذخیره‌سازی',gaming:'گیمینگ',tablets:'موبایل و تبلت',display:'نمایشگر و تصویر',photo:'عکاسی و تولید محتوا',other:'سایر'};
  const CATEGORY_LABEL = key => labels[key] || 'سایر';
  let products = [], reviews = [], activeCategory = 'all', cart = [], appliedCoupon = '';
  const grid = $('productGrid'), search = $('searchInput'), sort = $('sortSelect');
  const cartDrawer = $('cartDrawer'), cartItems = $('cartItems');
  const OVERRIDE_KEY = 'moonDemoCatalogOverrides', ADDITIONS_KEY = 'moonDemoCatalogAdditions';
  const DEMO_PASSWORD = 'MoonDemo#1405';

  function safeRead(key, fallback) {
    try { const value = JSON.parse(localStorage.getItem(key) || 'null'); return value ?? fallback; }
    catch { return fallback; }
  }
  function readOverrides() { return safeRead(OVERRIDE_KEY, {}); }
  function readAdditions() { return safeRead(ADDITIONS_KEY, []); }
  function applyLocalCatalog(base) {
    const overrides = readOverrides();
    const merged = base.map(p => ({...p, ...(overrides[String(p.id)] || {})}));
    const additions = readAdditions();
    const ids = new Set(merged.map(p => String(p.id)));
    additions.forEach(p => { if (!ids.has(String(p.id))) merged.push(p); });
    return merged;
  }
  function persistOverride(product) {
    const overrides = readOverrides();
    overrides[String(product.id)] = product;
    localStorage.setItem(OVERRIDE_KEY, JSON.stringify(overrides));
  }
  function discountPercent(p) {
    return p.originalPrice > p.price ? Math.max(1, Math.round((1 - p.price / p.originalPrice) * 100)) : 0;
  }
  function reviewStats(id) {
    const rows = reviews.filter(r => String(r.product_id) === String(id));
    return {count: rows.length, avg: rows.length ? rows.reduce((s,r)=>s+Number(r.rating),0)/rows.length : 0};
  }
  function setConnection(ok, message) {
    const status = $('rateStatus');
    if (status) {
      status.textContent = message;
      const dot = status.parentElement.querySelector('i');
      if (dot) dot.style.background = ok ? '#9dd6b1' : '#d6b18a';
    }
  }
  function loadCart() {
    cart = safeRead('moonDigitalCart', []);
    if (!Array.isArray(cart)) cart = [];
  }
  function saveCart() {
    localStorage.setItem('moonDigitalCart', JSON.stringify(cart));
    renderCart();
  }

  function productCard(p) {
    const article = document.createElement('article');
    article.className = 'product-card';
    const visual = document.createElement('div');
    visual.className = 'product-visual';
    if (p.imageUrl) {
      const image = document.createElement('img');
      image.className = 'product-image'; image.src = p.imageUrl; image.alt = p.name;
      image.loading = 'lazy'; image.decoding = 'async';
      image.onerror = () => {
        image.remove(); const fallback = document.createElement('div');
        fallback.className = 'product-symbol'; fallback.textContent = p.symbol || 'MOON'; visual.append(fallback);
      };
      visual.append(image);
    } else {
      const fallback = document.createElement('div');
      fallback.className = 'product-symbol'; fallback.textContent = p.symbol || 'MOON'; visual.append(fallback);
    }
    const tag = document.createElement('span'); tag.className='product-tag'; tag.textContent=p.categoryLabel;
    const code = document.createElement('span'); code.className='product-code'; code.textContent='MOON / '+String(p.id).slice(-5);
    visual.append(tag,code);
    if (p.featured) { const featured=document.createElement('span');featured.className='product-featured';featured.textContent='منتخب MOON';visual.append(featured); }
    const off = discountPercent(p);
    if (off) { const badge=document.createElement('span');badge.className='product-discount';badge.textContent=fa(off)+'٪ تخفیف';visual.append(badge); }

    const body=document.createElement('div');body.className='product-body';
    const title=document.createElement('h3');title.className='product-title';title.textContent=p.name;
    const desc=document.createElement('p');desc.className='product-desc';desc.textContent=p.description || '';
    const stats=reviewStats(p.id);
    const rating=document.createElement('div');rating.className='product-rating';
    rating.innerHTML = stats.count ? '<span>★</span> '+fa(stats.avg.toFixed(1))+' از ۱۰ · '+fa(stats.count)+' دیدگاه' : '<span>☆</span> هنوز امتیازی ثبت نشده';
    const stock=document.createElement('small');stock.className='product-stock';stock.textContent='کالای نمایشی · موجودی واقعی بررسی نشده';
    const price=document.createElement('div');price.className='product-price';
    const amount=document.createElement('strong');amount.className='usd';amount.textContent=money(p.price);
    const currencyLabel=document.createElement('div');currencyLabel.className='irr';currencyLabel.textContent='قیمت نمایشی';
    price.append(amount,currencyLabel);
    if (off) { const original=document.createElement('del');original.className='product-original';original.textContent=money(p.originalPrice);price.append(original); }
    const foot=document.createElement('div');foot.className='product-foot';
    const add=document.createElement('button');add.className='btn primary';add.type='button';add.textContent='افزودن به سبد +';
    add.addEventListener('click',()=>addToCart(p.id));
    const reviewBtn=document.createElement('button');reviewBtn.className='review-jump';reviewBtn.type='button';reviewBtn.textContent='ثبت نظر';
    reviewBtn.addEventListener('click',()=>{ $('reviewProduct').value=String(p.id); $('reviews').scrollIntoView({behavior:'smooth'}); });
    foot.append(add,reviewBtn);
    body.append(title,desc,rating,stock,price,foot);
    article.append(visual,body);
    return article;
  }

  function render() {
    if (!grid) return;
    const q=(search?.value || '').trim().toLocaleLowerCase('fa');
    let list=products.filter(p=>p.isActive!==false &&
      (activeCategory==='all'||p.category===activeCategory) &&
      (p.name+' '+p.description+' '+p.categoryLabel).toLocaleLowerCase('fa').includes(q));
    if (sort?.value==='low') list.sort((a,b)=>a.price-b.price);
    if (sort?.value==='high') list.sort((a,b)=>b.price-a.price);
    if (sort?.value==='name') list.sort((a,b)=>a.name.localeCompare(b.name,'fa'));
    if (sort?.value==='discount') list.sort((a,b)=>discountPercent(b)-discountPercent(a));
    $('resultCount').textContent=fa(list.length)+' کالا از '+fa(products.filter(p=>p.isActive!==false).length);
    grid.replaceChildren();
    if (!list.length) { const empty=document.createElement('div');empty.className='empty';empty.textContent='کالایی با این مشخصات پیدا نشد.';grid.append(empty);return; }
    list.forEach(p=>grid.append(productCard(p)));
  }

  function addToCart(id) {
    const p=products.find(x=>String(x.id)===String(id));
    if (!p) return;
    const row=cart.find(x=>String(x.id)===String(id));
    if (row) row.qty=(Number(row.qty)||0)+1; else cart.push({id:p.id,qty:1});
    saveCart(); cartDrawer?.classList.add('open');
  }
  function changeCartQty(id,delta) {
    const row=cart.find(x=>String(x.id)===String(id));
    if (!row) return;
    row.qty=(Number(row.qty)||0)+delta;
    if (row.qty<=0) cart=cart.filter(x=>String(x.id)!==String(id));
    saveCart();
  }
  function couponDiscount(total) {
    if (appliedCoupon==='MOON10') return Math.round(total*.10);
    if (appliedCoupon==='WELCOME15') return Math.round(total*.15);
    return 0;
  }
  function renderCart() {
    if (!cartItems) return;
    cartItems.replaceChildren();
    let total=0,qty=0;
    cart=cart.filter(row=>products.some(p=>String(p.id)===String(row.id))&&Number(row.qty)>0);
    cart.forEach(row=>{
      const p=products.find(x=>String(x.id)===String(row.id)); if(!p)return;
      const n=Math.max(1,Number(row.qty)||1),line=p.price*n;total+=line;qty+=n;
      const item=document.createElement('div');item.className='cart-item';
      const info=document.createElement('div');info.className='cart-item-info';
      const title=document.createElement('b');title.textContent=p.name;
      const price=document.createElement('small');price.textContent=money(line);
      const note=document.createElement('small');note.className='cart-stock-note';note.textContent='محصول نمایشی';
      info.append(title,price,note);
      const controls=document.createElement('div');controls.className='cart-qty';
      const minus=document.createElement('button');minus.type='button';minus.textContent='−';minus.setAttribute('aria-label','کم کردن تعداد');minus.addEventListener('click',()=>changeCartQty(row.id,-1));
      const amount=document.createElement('span');amount.textContent=fa(n);
      const plus=document.createElement('button');plus.type='button';plus.textContent='+';plus.setAttribute('aria-label','افزایش تعداد');plus.addEventListener('click',()=>changeCartQty(row.id,1));
      const remove=document.createElement('button');remove.type='button';remove.className='cart-remove';remove.textContent='حذف';remove.addEventListener('click',()=>{cart=cart.filter(x=>String(x.id)!==String(row.id));saveCart();});
      controls.append(minus,amount,plus);item.append(info,controls,remove);cartItems.append(item);
    });
    if(!qty){const empty=document.createElement('p');empty.className='empty';empty.textContent='سبد خریدت هنوز خالی است.';cartItems.append(empty);}
    const discount=couponDiscount(total);
    $('cartCount').textContent=fa(qty);
    $('cartTotal').textContent=money(total-discount);
    if($('cartDiscount')) $('cartDiscount').textContent=money(discount);
  }

  async function loadProducts() {
    setConnection(false,'در حال اتصال به کاتالوگ…');
    grid.textContent='در حال دریافت محصولات…';
    const {data,error}=await db.from('products')
      .select('id,name,description,price,currency,image_url,stock,category,category_label,symbol,original_price,is_featured,is_demo,is_active')
      .eq('is_active',true).order('id',{ascending:true});
    if(error){console.error(error);setConnection(false,'خطا در اتصال به کاتالوگ');grid.textContent='دریافت محصولات با خطا مواجه شد.';return;}
    const base=(data||[]).map(row=>({
      id:Number(row.id),name:row.name||'',description:row.description||'',price:Number(row.price)||0,
      originalPrice:Number(row.original_price)||0,imageUrl:row.image_url||'',category:row.category||'other',
      categoryLabel:row.category_label||CATEGORY_LABEL(row.category),symbol:row.symbol||'MOON',
      featured:Boolean(row.is_featured),isActive:Boolean(row.is_active),demo:true
    }));
    products=applyLocalCatalog(base);
    $('rateValue').textContent=fa(products.filter(p=>p.isActive!==false).length)+' کالا';
    setConnection(true,'کاتالوگ آنلاین متصل است');
    render(); renderCart(); fillReviewProducts();
    renderAdminProductsIfOpen();
  }

  async function loadReviews() {
    const {data,error}=await db.from('product_reviews')
      .select('id,product_id,reviewer_name,rating,comment,created_at,products(name)')
      .order('created_at',{ascending:false}).limit(100);
    if(error){console.warn('reviews',error);reviews=[];}
    else reviews=data||[];
    renderReviews();render();
    renderAdminReviews();
  }
  function fillReviewProducts() {
    const select=$('reviewProduct');if(!select)return;
    const current=select.value;
    select.replaceChildren();
    const first=document.createElement('option');first.value='';first.textContent='انتخاب محصول…';select.append(first);
    products.filter(p=>p.isActive!==false && Number.isFinite(Number(p.id))).forEach(p=>{const option=document.createElement('option');option.value=String(p.id);option.textContent=p.name;select.append(option);});
    if(current) select.value=current;
  }
  function renderReviews() {
    const list=$('reviewList');if(!list)return;
    $('reviewCount').textContent=fa(reviews.length)+' دیدگاه';
    list.replaceChildren();
    if(!reviews.length){const empty=document.createElement('p');empty.className='empty';empty.textContent='هنوز دیدگاهی ثبت نشده؛ اولین نفر باش.';list.append(empty);return;}
    reviews.slice(0,30).forEach(r=>{
      const card=document.createElement('article');card.className='review-card';
      const head=document.createElement('div');head.className='review-card-head';
      const name=document.createElement('b');name.textContent=r.reviewer_name||'کاربر Moon';
      const score=document.createElement('span');score.className='review-score';score.textContent='★ '+fa(r.rating)+'/۱۰';
      head.append(name,score);
      const product=document.createElement('small');product.textContent=r.products?.name||products.find(p=>String(p.id)===String(r.product_id))?.name||'محصول Moon Shop';
      const comment=document.createElement('p');comment.textContent=r.comment;
      const date=document.createElement('small');date.className='review-date';date.textContent=new Date(r.created_at).toLocaleDateString('fa-IR');
      card.append(head,product,comment,date);list.append(card);
    });
  }
  function renderAdminReviews() {
    const host=$('adminReviewsList');if(!host)return;
    host.replaceChildren();
    if(!reviews.length){host.textContent='هنوز دیدگاهی ثبت نشده است.';return;}
    reviews.slice(0,50).forEach(r=>{
      const card=document.createElement('article');card.className='admin-review-row';
      const name=document.createElement('b');name.textContent=r.reviewer_name+' · '+fa(r.rating)+'/۱۰';
      const product=document.createElement('small');product.textContent=r.products?.name||'محصول';
      const comment=document.createElement('p');comment.textContent=r.comment;
      card.append(name,product,comment);host.append(card);
    });
  }
  const rating=$('reviewRating');
  rating?.addEventListener('input',()=>{$('ratingValue').textContent=fa(rating.value)+' از ۱۰';});
  $('reviewForm')?.addEventListener('submit',async e=>{
    e.preventDefault();
    const productId=Number($('reviewProduct').value);
    const reviewerName=$('reviewName').value.trim();
    const comment=$('reviewComment').value.trim();
    const score=Number(rating.value);
    if(!productId||reviewerName.length<2||comment.length<8){$('reviewMessage').textContent='لطفاً همه فیلدها را کامل کن.';return;}
    const button=$('reviewSubmit');button.disabled=true;button.textContent='در حال ثبت…';
    const {error}=await db.from('product_reviews').insert({product_id:productId,reviewer_name:reviewerName,rating:score,comment,is_approved:true});
    button.disabled=false;button.textContent='ثبت دیدگاه';
    if(error){$('reviewMessage').textContent='ثبت دیدگاه انجام نشد. دوباره تلاش کن.';console.error(error);return;}
    $('reviewMessage').textContent='دیدگاهت ثبت شد. ممنون از مشارکتت!';
    $('reviewComment').value='';await loadReviews();
  });

  document.querySelectorAll('.category').forEach(btn=>btn.addEventListener('click',()=>{
    activeCategory=btn.dataset.category;
    document.querySelectorAll('.category').forEach(x=>x.classList.toggle('active',x===btn));
    render();
  }));
  document.querySelectorAll('.category-tile').forEach(tile=>tile.addEventListener('click',()=>{
    const btn=document.querySelector('.category[data-category="'+tile.dataset.category+'"]');
    if(btn)btn.click();
    $('products').scrollIntoView({behavior:'smooth'});
  }));
  search?.addEventListener('input',render);sort?.addEventListener('change',render);
  $('cartButton')?.addEventListener('click',()=>cartDrawer.classList.add('open'));
  $('cartClose')?.addEventListener('click',()=>cartDrawer.classList.remove('open'));
  cartDrawer?.addEventListener('click',e=>{if(e.target===cartDrawer)cartDrawer.classList.remove('open');});
  $('applyCoupon')?.addEventListener('click',()=>{
    const code=$('couponInput').value.trim().toUpperCase();
    if(code==='MOON10'||code==='WELCOME15'){appliedCoupon=code;$('couponMessage').textContent=code==='MOON10'?'کد MOON10 فعال شد؛ ۱۰٪ تخفیف اعمال شد.':'کد WELCOME15 فعال شد؛ ۱۵٪ تخفیف اعمال شد.';$('couponMessage').classList.add('success');}
    else{appliedCoupon='';$('couponMessage').textContent='کد تخفیف معتبر نیست.';$('couponMessage').classList.remove('success');}
    renderCart();
  });
  $('checkoutDemo')?.addEventListener('click',()=>alert('این یک نمونه‌کار نمایشی است؛ درگاه پرداخت و ثبت سفارش واقعی هنوز فعال نشده است.'));
  $('menuToggle')?.addEventListener('click',()=>{const open=$('mainNav').classList.toggle('open');$('menuToggle').setAttribute('aria-expanded',String(open));});
  document.querySelectorAll('#mainNav a').forEach(a=>a.addEventListener('click',()=>{$('mainNav').classList.remove('open');$('menuToggle').setAttribute('aria-expanded','false');}));

  // Demo-only admin: changes are stored in this browser, not in the shared database.
  const loginView=$('loginView'),adminView=$('adminView'),loginForm=$('loginForm');
  const body=$('productsBody'),modal=$('productModal'),productForm=$('productForm');
  let adminProducts=[];
  function note(el,text,success=false){if(!el)return;el.textContent=text;el.classList.toggle('success',success);}
  function showAdmin(){loginView.classList.add('hidden');adminView.classList.remove('hidden');loadAdminProducts();}
  function showLogin(){adminView.classList.add('hidden');loginView.classList.remove('hidden');}
  function loadAdminProducts(){
    adminProducts=products.slice();
    $('totalCount').textContent=fa(adminProducts.length);
    $('activeCount').textContent=fa(adminProducts.filter(p=>p.isActive!==false).length);
    $('stockCount').textContent='—';
    $('lowStockCount').textContent='دمو';
    $('lowStockList').textContent='موجودی واقعی در این نمونه‌کار ثبت نشده است.';
    renderAdminProducts();renderAdminReviews();
    note($('workspaceMessage'),'کاتالوگ نمایشی آماده است.',true);
  }
  function renderAdminProducts(){
    if(!body)return;
    if(adminView?.classList.contains('hidden'))return;
    const query=$('adminSearchInput').value.trim().toLocaleLowerCase('fa');
    const rows=adminProducts.filter(p=>p.name.toLocaleLowerCase('fa').includes(query));
    body.replaceChildren();
    if(!rows.length){const tr=document.createElement('tr'),td=document.createElement('td');td.colSpan=5;td.textContent='محصولی پیدا نشد.';tr.append(td);body.append(tr);return;}
    rows.forEach(p=>{
      const tr=document.createElement('tr');
      const name=document.createElement('td');name.textContent=p.name;
      const price=document.createElement('td');price.textContent=money(p.price);
      const stock=document.createElement('td');stock.textContent='نمایشی';
      const status=document.createElement('td');const pill=document.createElement('span');pill.className='pill'+(p.isActive===false?' inactive':'');pill.textContent=p.isActive===false?'مخفی':'فعال';status.append(pill);
      const actions=document.createElement('td');
      const edit=document.createElement('button');edit.textContent='ویرایش';edit.addEventListener('click',()=>openEditor(p));
      const toggle=document.createElement('button');toggle.textContent=p.isActive===false?'فعال‌کردن':'مخفی‌کردن';toggle.addEventListener('click',()=>toggleProduct(p));
      const del=document.createElement('button');del.className='delete';del.textContent='حذف';del.addEventListener('click',()=>deleteProduct(p));
      actions.append(edit,toggle,del);tr.append(name,price,stock,status,actions);body.append(tr);
    });
  }
  function renderAdminProductsIfOpen(){if(adminView&&!adminView.classList.contains('hidden'))loadAdminProducts();}
  function openEditor(p=null){
    productForm.reset();$('productId').value=p?.id??'';
    $('modalTitle').textContent=p?'ویرایش محصول':'افزودن محصول';
    $('productName').value=p?.name||'';$('productDescription').value=p?.description||'';
    $('productPrice').value=p?.price??'';$('productOriginalPrice').value=p?.originalPrice||'';
    $('productStock').value=999;$('productImage').value=p?.imageUrl||'';
    $('productCategory').value=p?.category||'other';$('productSymbol').value=p?.symbol||'MOON';
    $('productActive').checked=p?p.isActive!==false:true;$('productFeatured').checked=Boolean(p?.featured);
    note($('formMessage'),'');modal.classList.remove('hidden');
  }
  function closeEditor(){modal.classList.add('hidden');}
  function saveLocalProduct(p){
    const additions=readAdditions();
    const index=additions.findIndex(x=>String(x.id)===String(p.id));
    if(index>=0){additions[index]=p;localStorage.setItem(ADDITIONS_KEY,JSON.stringify(additions));}
    else persistOverride(p);
  }
  function toggleProduct(p){
    const updated={...p,isActive:p.isActive===false};
    saveLocalProduct(updated);products=applyLocalCatalog(products.filter(x=>String(x.id)!==String(p.id)).concat(updated));
    loadAdminProducts();render();fillReviewProducts();
  }
  function deleteProduct(p){
    if(!confirm('محصول «'+p.name+'» از نمایش این مرورگر حذف شود؟'))return;
    if(String(p.id).startsWith('demo-')){
      localStorage.setItem(ADDITIONS_KEY,JSON.stringify(readAdditions().filter(x=>String(x.id)!==String(p.id))));
    }else persistOverride({...p,isActive:false});
    products=products.filter(x=>String(x.id)!==String(p.id));cart=cart.filter(x=>String(x.id)!==String(p.id));
    saveCart();loadAdminProducts();render();fillReviewProducts();
  }
  loginForm?.addEventListener('submit',e=>{
    e.preventDefault();const button=$('loginButton');button.disabled=true;
    if($('password').value===DEMO_PASSWORD){sessionStorage.setItem('moonDemoAdminUnlocked','1');note($('loginMessage'),'ورود موفق بود.',true);showAdmin();}
    else note($('loginMessage'),'رمز مدیریت نادرست است.');
    button.disabled=false;
  });
  $('logoutButton')?.addEventListener('click',()=>{sessionStorage.removeItem('moonDemoAdminUnlocked');showLogin();note($('loginMessage'),'از پنل خارج شدی.',true);});
  $('addButton')?.addEventListener('click',()=>openEditor());
  $('closeModal')?.addEventListener('click',closeEditor);$('cancelButton')?.addEventListener('click',closeEditor);
  modal?.addEventListener('click',e=>{if(e.target===modal)closeEditor();});
  $('adminSearchInput')?.addEventListener('input',renderAdminProducts);
  $('refreshButton')?.addEventListener('click',loadAdminProducts);
  document.querySelectorAll('[data-admin-tab]').forEach(tab=>tab.addEventListener('click',()=>{
    const selected=tab.dataset.adminTab;
    document.querySelectorAll('[data-admin-tab]').forEach(x=>x.classList.toggle('active',x===tab));
    document.querySelectorAll('[data-admin-panel]').forEach(panel=>panel.classList.toggle('hidden',panel.dataset.adminPanel!==selected));
    if(selected==='reviews')renderAdminReviews();
  }));
  productForm?.addEventListener('submit',e=>{
    e.preventDefault();
    const id=$('productId').value||'demo-'+Date.now();
    const category=$('productCategory').value,price=Number($('productPrice').value),originalPrice=Number($('productOriginalPrice').value)||0;
    const name=$('productName').value.trim();
    if(name.length<2||!Number.isFinite(price)||price<=0){note($('formMessage'),'نام و قیمت محصول را بررسی کن.');return;}
    const product={
      id,name,description:$('productDescription').value.trim(),price,originalPrice:originalPrice>price?originalPrice:0,
      imageUrl:$('productImage').value.trim(),category,categoryLabel:CATEGORY_LABEL(category),
      symbol:$('productSymbol').value.trim()||'MOON',featured:$('productFeatured').checked,
      isActive:$('productActive').checked,demo:true
    };
    if(String(id).startsWith('demo-')&&!products.some(p=>String(p.id)===String(id))) {
      const additions=readAdditions();additions.push(product);localStorage.setItem(ADDITIONS_KEY,JSON.stringify(additions));
    } else saveLocalProduct(product);
    products=applyLocalCatalog(products.filter(p=>String(p.id)!==String(id)).concat(product));
    closeEditor();loadAdminProducts();render();fillReviewProducts();
  });
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeEditor();cartDrawer?.classList.remove('open');}});
  if(sessionStorage.getItem('moonDemoAdminUnlocked')==='1')showAdmin();else showLogin();

  loadCart();loadProducts();loadReviews();
})();