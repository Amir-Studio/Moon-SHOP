(() => {
  const RATE_URL = 'https://raw.githubusercontent.com/iran-market/iran-market.github.io/main/data/popular.json';
  const RATE_MAX_AGE = 2 * 60 * 60 * 1000;
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
  let usdRate = null;
  let rateLabel = 'در انتظار دریافت نرخ زنده';
  let activeCategory = 'all';
  let cart = [];
  const fa = n => Number(n || 0).toLocaleString('fa-IR');
  const money = n => Math.round(Number(n || 0)).toLocaleString('fa-IR') + ' تومان';
  const roundToman = n => Math.round(n / 1000) * 1000;
  function getCart(){ try { cart = JSON.parse(localStorage.getItem('moonDigitalCart') || '[]'); if(!Array.isArray(cart)) cart=[]; } catch(e){ cart=[]; } }
  function saveCart(){ try { localStorage.setItem('moonDigitalCart', JSON.stringify(cart)); } catch(e){} renderCart(); }
  function renderRate(){
    rateValue.textContent = usdRate ? fa(usdRate) : '—';
    rateStamp.textContent = rateLabel;
    rateStatus.textContent = usdRate ? 'نرخ زنده بازار آزاد' : 'نرخ زنده موقتاً در دسترس نیست';
    rateStatus.parentElement.querySelector('i').style.background = usdRate ? '#9dd6b1' : '#d6b18a';
    document.querySelectorAll('[data-usd]').forEach(el => {
      el.textContent = usdRate ? money(roundToman(Number(el.dataset.usd || 0) * usdRate)) : 'فعلاً نامشخص';
    });
    renderCart();
  }
  async function loadRate(){
    try{
      const response = await fetch(RATE_URL + '?v=' + Date.now(), {cache:'no-store'});
      if(!response.ok) throw new Error('rate unavailable');
      const payload = await response.json();
      const item = (payload.data || []).find(x => x.symbol === 'USD_IRR_FREE');
      const stamp = Date.parse(item && item.timestamp || payload.meta && payload.meta.updated_at || '');
      if(!item || !Number.isFinite(Number(item.price)) || Number(item.price) <= 0 || item.stale || !Number.isFinite(stamp) || Date.now() - stamp > RATE_MAX_AGE || stamp > Date.now() + 5*60*1000) throw new Error('stale rate');
      usdRate = Number(item.price);
      rateLabel = 'نرخ زنده بازار آزاد · ' + new Date(stamp).toLocaleString('fa-IR');
    }catch(e){
      usdRate = null;
      rateLabel = 'نرخ معتبر دریافت نشد؛ تبدیل تومانی موقتاً غیرفعال است';
    }
    renderRate();
  }
  function productCard(p){
    const article = document.createElement('article'); article.className='product-card';
    const visual = document.createElement('div'); visual.className='product-visual';
    const image = document.createElement('img'); image.className='product-image'; image.src=p.imageUrl; image.alt=p.name; image.loading='lazy'; image.decoding='async';
    image.onerror=()=>{image.remove(); const fallback=document.createElement('div');fallback.className='product-symbol';fallback.textContent=p.symbol;visual.append(fallback);};
    const tag = document.createElement('span'); tag.className='product-tag'; tag.textContent=p.categoryLabel;
    const code = document.createElement('span'); code.className='product-code'; code.textContent='MOON / '+String(p.id).padStart(3,'0');
    visual.append(image,tag,code);
    const body = document.createElement('div'); body.className='product-body';
    const title = document.createElement('h3'); title.className='product-title'; title.textContent=p.name;
    const desc = document.createElement('p'); desc.className='product-desc'; desc.textContent=p.description;
    const price = document.createElement('div'); price.className='product-price';
    const usd = document.createElement('strong'); usd.className='usd'; usd.textContent='$'+Number(p.usd).toFixed(2);
    const irrWrap = document.createElement('div'); irrWrap.className='irr';
    const irr = document.createElement('b'); irr.dataset.usd=p.usd; irr.textContent=usdRate ? money(roundToman(p.usd*usdRate)) : 'فعلاً نامشخص';
    const irrSmall = document.createElement('small'); irrSmall.textContent='معادل تقریبی با نرخ زنده';
    irrWrap.append(irr,irrSmall); price.append(usd,irrWrap);
    const foot = document.createElement('div'); foot.className='product-foot';
    const source = document.createElement('a'); source.className='source-link'; source.href=p.sourceUrl; source.target='_blank'; source.rel='noopener noreferrer'; source.textContent='بررسی مرجع قیمت ↗';
    const add = document.createElement('button'); add.className='btn primary'; add.type='button'; add.textContent='افزودن به سبد +'; add.addEventListener('click',()=>addToCart(p.id));
    foot.append(source,add); body.append(title,desc,price,foot); article.append(visual,body); return article;
  }
  function render(){
    const q = search.value.trim().toLocaleLowerCase('fa');
    let list = products.filter(p => (activeCategory==='all'||p.category===activeCategory) && (p.name+' '+p.description+' '+p.categoryLabel).toLocaleLowerCase('fa').includes(q));
    if(sort.value==='low') list.sort((a,b)=>a.usd-b.usd);
    if(sort.value==='high') list.sort((a,b)=>b.usd-a.usd);
    if(sort.value==='name') list.sort((a,b)=>a.name.localeCompare(b.name,'fa'));
    count.textContent = fa(list.length)+' کالا از '+fa(products.length);
    grid.replaceChildren();
    if(!list.length){const e=document.createElement('div');e.className='empty';e.textContent='کالایی با این مشخصات پیدا نشد.';grid.append(e);return;}
    list.forEach(p=>grid.append(productCard(p)));
  }
  function addToCart(id){const item=cart.find(x=>x.id===id);if(item)item.qty+=1;else cart.push({id,qty:1});saveCart();cartDrawer.classList.add('open');}
  function renderCart(){
    if(!cartItems)return;
    cartItems.replaceChildren();let total=0,qty=0;
    cart.forEach(row=>{const p=products.find(x=>x.id===row.id);if(!p)return;total+=p.usd*row.qty;qty+=row.qty;
      const item=document.createElement('div');item.className='cart-item';const info=document.createElement('div');
      const title=document.createElement('b');title.textContent=p.name+' × '+fa(row.qty);
      const price=document.createElement('small');price.textContent='$'+(p.usd*row.qty).toFixed(2)+(usdRate?' · '+money(roundToman(p.usd*row.qty*usdRate)):' · تبدیل تومانی نامشخص');
      info.append(title,price);const remove=document.createElement('button');remove.type='button';remove.textContent='حذف';remove.addEventListener('click',()=>{cart=cart.filter(x=>x.id!==row.id);saveCart();});item.append(info,remove);cartItems.append(item);
    });
    if(!qty){const empty=document.createElement('p');empty.className='empty';empty.textContent='سبد انتخابت هنوز خالی است.';cartItems.append(empty);}
    cartCount.textContent=fa(qty);cartTotal.textContent=usdRate?money(roundToman(total*usdRate)):'تبدیل تومانی نامشخص';
  }
  document.querySelectorAll('.category').forEach(btn=>btn.addEventListener('click',()=>{activeCategory=btn.dataset.category;document.querySelectorAll('.category').forEach(x=>x.classList.toggle('active',x===btn));render();}));
  search.addEventListener('input',render);sort.addEventListener('change',render);
  cartButton.addEventListener('click',e=>{e.preventDefault();cartDrawer.classList.add('open')});
  cartClose.addEventListener('click',()=>cartDrawer.classList.remove('open'));
  cartDrawer.addEventListener('click',e=>{if(e.target===cartDrawer)cartDrawer.classList.remove('open')});
  menuToggle.addEventListener('click',()=>{const open=nav.classList.toggle('open');menuToggle.setAttribute('aria-expanded',String(open));});
  nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{nav.classList.remove('open');menuToggle.setAttribute('aria-expanded','false')}));
  fetch('data/products.json').then(r=>{if(!r.ok)throw new Error('products missing');return r.json()}).then(data=>{products=Array.isArray(data)?data:[];render();renderCart();}).catch(()=>{grid.textContent='فهرست کالاها بارگذاری نشد؛ صفحه را تازه‌سازی کن.';});
  getCart();loadRate();setInterval(loadRate,30*60*1000);
})();