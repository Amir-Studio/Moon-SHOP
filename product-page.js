import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.119.0/+esm';
const db=createClient('https://oolfbjxclhzlbwjmzxxx.supabase.co','sb_publishable_Q_eVY-Arb4hZQudDYrwy0Q_TbrUGAIv');
const $=id=>document.getElementById(id);
const fa=n=>Number(n||0).toLocaleString('fa-IR');
const money=n=>Math.round(Number(n||0)).toLocaleString('fa-IR')+' تومان';
const labels={charging:'شارژ و برق',peripherals:'لوازم جانبی',connectivity:'اتصال و تبدیل',audio:'صوتی و تصویری',smart:'هوشمند و پوشیدنی',storage:'حافظه و ذخیره‌سازی',gaming:'گیمینگ',tablets:'موبایل و تبلت',display:'نمایشگر و تصویر',photo:'عکاسی و تولید محتوا',other:'سایر'};
const sampleNames=['آراد','پارسا','نیما','رها','کیان','هلیا','سام','آوا','مانی','نیکا','بردیا','ترانه','آرین','یلدا'];
const sampleTexts=[
'برای استفادهٔ روزمره گزینهٔ قابل بررسی‌ای است؛ چیزی که برای من مهم بود تناسب امکانات با نیاز واقعی بود.',
'طراحی و جزئیات محصول توجه‌ام را جلب کرد. پیش از خرید واقعی، سازگاری مدل با دستگاه را دوباره بررسی می‌کنم.',
'توضیحات فنی کمک می‌کند بهتر تصمیم بگیرم. کاش اطلاعات اقلام داخل جعبه هم دقیق‌تر درج شود.',
'از نظر امکانات، انتخاب جالبی به نظر می‌رسد؛ مخصوصاً اگر دقیقاً دنبال همین قابلیت‌ها باشید.',
'ظاهر ساده و کاربردی‌اش را می‌پسندم. برای انتخاب نهایی، مقایسه با دو مدل هم‌رده را پیشنهاد می‌کنم.',
'نکتهٔ مثبتش این است که کاربرد محصول روشن توضیح داده شده؛ گارانتی و اصالت کالا هم باید بررسی شود.',
'در بررسی اولیه حس خوبی داشتم، اما دربارهٔ دوام بلندمدت نمی‌شود فقط با مشخصات فنی نظر قطعی داد.',
'برای کسی که این نوع محصول را لازم دارد ارزش بررسی دارد؛ قیمت نهایی و شرایط فروشنده هم مهم‌اند.',
'انتظار داشتم جزئیات بیشتری دربارهٔ سازگاری و محدودیت‌های محصول نوشته شود؛ بقیهٔ اطلاعات صفحه مفید است.',
'به نظرم بهتر است قبل از انتخاب، نیازتان را مشخص کنید؛ همهٔ قابلیت‌ها برای همه کاربردی نیستند.',
'از بین نکاتی که بررسی کردم، مشخصات فنی از همه کمک‌کننده‌تر بود. عکس واقعی از زوایای بیشتر هم مفید می‌شود.',
'این مدل در فهرست مقایسه‌ام قرار گرفت؛ هنوز برای قضاوت دربارهٔ ارزش خرید باید قیمت بازار را هم دید.',
'برای استفادهٔ معمولی به نظر مناسب می‌آید، ولی اگر استفادهٔ سنگین دارید بهتر است محدودیت‌هایش را بخوانید.',
'صفحهٔ مشخصات مرتب است و سریع می‌شود نکات اصلی را پیدا کرد. اطلاعات گارانتی جای تکمیل دارد.',
'ظاهر محصول مطابق چیزی است که از این رده انتظار می‌رود؛ مهم‌تر از ظاهر، سازگاری و خدمات پس از فروش است.',
'من اول به مشخصات و بعد به قیمت نگاه می‌کنم؛ این مدل چند ویژگی قابل توجه برای مقایسه دارد.',
'توضیح کاربرد محصول کمک کرد بفهمم برای چه نوع استفاده‌ای طراحی شده؛ این بخش را کامل‌تر کنید بهتر هم می‌شود.',
'در نگاه اول انتخاب بدی نیست، اما برای نظر نهایی باید تجربهٔ واقعی خریداران و بررسی مستقل را دید.',
'نسبت ویژگی‌ها به کاربردش قابل توجه است؛ اگر این امکانات را لازم دارید، ارزش مقایسه دارد.',
'دوست داشتم اطلاعات ابعاد و وزن هم واضح‌تر باشد. برای انتخاب لوازم دیجیتال این جزئیات گاهی تعیین‌کننده‌اند.',
'مشخصات اصلی خوانا و مرتب‌اند. بهتر است تفاوت نسخه‌ها یا مدل‌های نزدیک هم در صفحه توضیح داده شود.',
'این کالا را با چند گزینهٔ دیگر مقایسه کردم؛ انتخاب درست کاملاً به اولویت و بودجه بستگی دارد.',
'نکتهٔ کاربردی صفحه، جمع‌کردن مشخصات در یک بخش است. قبل از سفارش واقعی حتماً فروشنده و موجودی را چک کنید.',
'برای تصمیم‌گیری اولیه اطلاعات خوبی دارد، ولی این متن یک نظر نمونه است و تجربهٔ خرید واقعی محسوب نمی‌شود.'
];
const params=new URLSearchParams(location.search);
const productId=Number(params.get('id'));
let product=null, realReviews=[];
function makeSampleReviews(p){
 const seed=Math.abs(Number(p.id)||1);
 return Array.from({length:8},(_,i)=>{
  const ix=(i+seed*3)%sampleTexts.length;
  const score=6+((seed+i*3)%5);
  const name=sampleNames[(seed*2+i*3)%sampleNames.length];
  const days=2+((seed*7+i*11)%150);
  const date=new Date(Date.now()-days*86400000);
  return {name,score,comment:sampleTexts[ix],date,kind:'sample'};
 });
}
function makeReviewCard(r){
 const card=document.createElement('article');card.className='product-review-card';
 const head=document.createElement('div');head.className='product-review-card-head';
 const name=document.createElement('b');name.textContent=r.reviewer_name||r.name||'کاربر';
 const score=document.createElement('strong');score.textContent='★ '+fa(r.rating||r.score)+'/۱۰';
 head.append(name,score);
 const comment=document.createElement('p');comment.textContent=r.comment||'';
 const meta=document.createElement('div');meta.className='product-review-meta';
 const kind=document.createElement('span');kind.className='review-kind'+(r.kind==='real'?' real':'');kind.textContent=r.kind==='real'?'ثبت‌شده':'دیدگاه';
 const date=document.createElement('time');date.textContent=r.created_at?new Date(r.created_at).toLocaleDateString('fa-IR'):r.date.toLocaleDateString('fa-IR');
 meta.append(kind,date);card.append(head,comment,meta);return card;
}
function renderReviews(){
 const samples=makeSampleReviews(product);
 const host=$('productReviewList');host.replaceChildren();
 [...realReviews.map(r=>({...r,kind:'real'})),...samples].forEach(r=>host.append(makeReviewCard(r)));
 $('productReviewCount').textContent=fa(samples.length+realReviews.length)+' دیدگاه';
 const avg=samples.reduce((n,r)=>n+r.score,0)/samples.length;
 $('reviewScoreCard').innerHTML='<strong>'+fa(avg.toFixed(1))+' / ۱۰</strong>میانگین امتیاز نمونه · '+fa(samples.length)+' نظر نمونه'+(realReviews.length?' · '+fa(realReviews.length)+' نظر ثبت‌شده':'');
 $('ratingSummary').innerHTML='<strong>★ '+fa(avg.toFixed(1))+' از ۱۰</strong> <span>بر پایهٔ ۸ نظر نمونهٔ نمایشی</span>'+(realReviews.length?' · '+fa(realReviews.length)+' دیدگاه ثبت‌شده':'');
}
function marketplaceLinks(name){
 const q=encodeURIComponent(name);
 const links=[['دیجی‌کالا','https://www.digikala.com/search/?q='+q],['ترب','https://torob.com/search/?q='+q],['باسلام','https://basalam.com/search?q='+q]];
 const host=$('productMarketplaces');host.replaceChildren();
 links.forEach(([label,url])=>{const a=document.createElement('a');a.href=url;a.target='_blank';a.rel='noopener noreferrer';a.textContent='جست‌وجو در '+label+' ↗';host.append(a);});
}
function renderProduct(p){
 document.title=p.name+' | Moon Shop';
 $('breadcrumbName').textContent=p.name;$('productName').textContent=p.name;
 $('productCategory').textContent=p.category_label||labels[p.category]||'سایر';
 $('productCode').textContent='MOON / '+String(p.id).padStart(4,'0');
 $('productDescription').textContent=p.description||'اطلاعات تکمیلی این محصول در حال آماده‌سازی است.';
 $('productLongDescription').textContent=p.description||'برای آشنایی با کاربرد و مشخصات محصول، جزئیات فنی را بررسی کنید.';
 $('productUsage').textContent=p.usage||'پیش از انتخاب، نیاز خود و سازگاری محصول با دستگاه‌هایتان را بررسی کنید.';
 $('productPrice').textContent=money(p.price);
 const photo=$('productImage');photo.replaceChildren();
 if(p.image_url){const img=document.createElement('img');img.src=p.image_url;img.alt=p.name;img.loading='eager';img.referrerPolicy='no-referrer';img.onerror=()=>{photo.replaceChildren();const fallback=document.createElement('span');fallback.textContent=p.category_label||'MOON';photo.append(fallback);};photo.append(img);}
 else{const fallback=document.createElement('span');fallback.textContent=p.category_label||'MOON';photo.append(fallback);}
 const features=$('productFeatures');features.replaceChildren();
 String(p.features||'کاربرد روزمره|طراحی کاربردی|بررسی سازگاری پیش از خرید').split('|').filter(Boolean).forEach(x=>{const li=document.createElement('li');li.textContent=x;features.append(li);});
 const specs=$('productSpecs');specs.replaceChildren();
 Object.entries(p.specifications||{}).forEach(([key,value])=>{const wrap=document.createElement('div');const dt=document.createElement('dt');dt.textContent=key;const dd=document.createElement('dd');dd.textContent=String(value);wrap.append(dt,dd);specs.append(wrap);});
 $('addToCart').addEventListener('click',()=>{
  let cart=[];try{cart=JSON.parse(localStorage.getItem('moonDigitalCart')||'[]');if(!Array.isArray(cart))cart=[];}catch{}
  const row=cart.find(x=>String(x.id)===String(p.id));if(row)row.qty=(Number(row.qty)||0)+1;else cart.push({id:p.id,qty:1});
  localStorage.setItem('moonDigitalCart',JSON.stringify(cart));
  $('addToCart').textContent='به سبد اضافه شد ✓';
 });
 marketplaceLinks(p.name);
 $('productState').classList.add('hidden');$('productContent').classList.remove('hidden');$('productMore').classList.remove('hidden');$('productReviews').classList.remove('hidden');
 renderReviews();
}
async function loadRealReviews(){
 const {data,error}=await db.from('product_reviews').select('id,reviewer_name,rating,comment,created_at').eq('product_id',productId).eq('is_approved',true).order('created_at',{ascending:false}).limit(100);
 if(error){console.warn('Review loading failed',error);realReviews=[];}else realReviews=data||[];
 renderReviews();
}
$('reviewRating').addEventListener('input',e=>{$('reviewRatingValue').textContent=fa(e.target.value)+' از ۱۰';});
$('productReviewForm').addEventListener('submit',async e=>{
 e.preventDefault();
 const name=$('reviewerName').value.trim(),comment=$('reviewText').value.trim(),rating=Number($('reviewRating').value);
 if(name.length<2||comment.length<8){$('reviewNotice').textContent='نام و متن دیدگاه را کامل وارد کن.';return;}
 const button=$('submitReview');button.disabled=true;button.textContent='در حال ثبت…';
 const {error}=await db.from('product_reviews').insert({product_id:productId,reviewer_name:name,rating,comment,is_approved:true});
 button.disabled=false;button.textContent='ثبت دیدگاه';
 if(error){$('reviewNotice').textContent='ثبت دیدگاه انجام نشد؛ لطفاً دوباره تلاش کن.';console.error(error);return;}
 $('reviewNotice').textContent='دیدگاهت با موفقیت ثبت شد. ممنون از مشارکتت!';
 $('reviewText').value='';await loadRealReviews();
});
async function init(){
 if(!Number.isInteger(productId)||productId<=0){$('productState').textContent='شناسهٔ محصول معتبر نیست.';return;}
 const {data,error}=await db.from('products').select('id,name,description,usage,features,specifications,price,image_url,category,category_label,is_active').eq('id',productId).eq('is_active',true).maybeSingle();
 if(error||!data){$('productState').textContent='محصول پیدا نشد یا در حال حاضر فعال نیست.';return;}
 product=data;renderProduct(product);await loadRealReviews();
}
init();
