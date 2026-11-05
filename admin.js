import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'https://oolfbjxclhzlbwjmzxxx.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_Q_eVY-Arb4hZQudDYrwy0Q_TbrUGAIv';
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

const $ = (id) => document.getElementById(id);
const loginView = $('loginView');
const adminView = $('adminView');
const loginForm = $('loginForm');
const loginMessage = $('loginMessage');
const loginButton = $('loginButton');
const productsBody = $('productsBody');
const workspaceMessage = $('workspaceMessage');
const modal = $('productModal');
const productForm = $('productForm');
let products = [];

const fa = value => Number(value || 0).toLocaleString('fa-IR');
const toman = value => fa(value) + ' تومان';
function message(el, text, success = false) {
  el.textContent = text;
  el.classList.toggle('success', success);
}
function showWorkspace() {
  loginView.classList.add('hidden');
  adminView.classList.remove('hidden');
}
function showLogin() {
  adminView.classList.add('hidden');
  loginView.classList.remove('hidden');
}
async function checkAdmin() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;
  const { data, error } = await supabase.from('admin_users').select('user_id').eq('user_id', session.user.id).maybeSingle();
  if (error || !data) {
    await supabase.auth.signOut();
    message(loginMessage, 'این حساب دسترسی مدیر ندارد. ابتدا شناسه کاربر را در جدول admin_users ثبت کنید.');
    return;
  }
  showWorkspace();
  await loadProducts();
}
loginForm.addEventListener('submit', async event => {
  event.preventDefault();
  loginButton.disabled = true;
  message(loginMessage, 'در حال بررسی اطلاعات ورود…');
  const { error } = await supabase.auth.signInWithPassword({
    email: $('email').value.trim(),
    password: $('password').value
  });
  loginButton.disabled = false;
  if (error) {
    message(loginMessage, 'ورود انجام نشد: ' + error.message);
    return;
  }
  await checkAdmin();
});
$('logoutButton').addEventListener('click', async () => {
  await supabase.auth.signOut();
  products = [];
  showLogin();
  message(loginMessage, 'از حساب خارج شدید.', true);
});
async function loadProducts() {
  productsBody.innerHTML = '<tr><td colspan="6" class="empty-cell">در حال دریافت محصولات…</td></tr>';
  const { data, error } = await supabase.from('products')
    .select('id,name,description,price,currency,image_url,stock,is_active,category,category_label,symbol')
    .order('id', { ascending: true });
  if (error) {
    productsBody.innerHTML = '<tr><td colspan="6" class="empty-cell"></td></tr>';
    productsBody.querySelector('.empty-cell').textContent = 'خطا در دریافت محصولات: ' + error.message;
    message(workspaceMessage, 'دریافت اطلاعات ناموفق بود. مجوزهای مدیر و RLS را بررسی کنید.');
    return;
  }
  products = data || [];
  $('totalCount').textContent = fa(products.length);
  $('activeCount').textContent = fa(products.filter(p => p.is_active).length);
  $('stockCount').textContent = fa(products.reduce((sum, p) => sum + Number(p.stock || 0), 0));
  renderProducts();
  message(workspaceMessage, 'اطلاعات با موفقیت به‌روز شد.', true);
}
function renderProducts() {
  const query = $('searchInput').value.trim().toLocaleLowerCase();
  const visible = products.filter(p => (p.name || '').toLocaleLowerCase().includes(query));
  productsBody.replaceChildren();
  if (!visible.length) {
    const tr = document.createElement('tr'); const td = document.createElement('td');
    td.colSpan = 6; td.className = 'empty-cell'; td.textContent = 'محصولی پیدا نشد.';
    tr.append(td); productsBody.append(tr); return;
  }
  visible.forEach(p => {
    const tr = document.createElement('tr');
    const productTd = document.createElement('td');
    const productCell = document.createElement('div'); productCell.className = 'product-cell';
    if (p.image_url) {
      const img = document.createElement('img'); img.className = 'product-thumb'; img.src = p.image_url; img.alt = ''; img.loading = 'lazy';
      img.onerror = () => { img.replaceWith(makeFallback(p.symbol)); };
      productCell.append(img);
    } else productCell.append(makeFallback(p.symbol));
    const info = document.createElement('div');
    const name = document.createElement('div'); name.className = 'product-name'; name.textContent = p.name;
    const id = document.createElement('div'); id.className = 'product-id'; id.textContent = 'MOON / ' + p.id;
    info.append(name, id); productCell.append(info); productTd.append(productCell);
    const category = document.createElement('td'); category.textContent = p.category_label || categoryName(p.category);
    const price = document.createElement('td'); price.className = 'price-cell'; price.textContent = toman(p.price);
    const stock = document.createElement('td'); stock.textContent = fa(p.stock);
    const status = document.createElement('td'); const pill = document.createElement('span'); pill.className = 'pill ' + (p.is_active ? 'active' : 'inactive'); pill.textContent = p.is_active ? 'فعال' : 'غیرفعال'; status.append(pill);
    const actions = document.createElement('td'); const actionBox = document.createElement('div'); actionBox.className = 'row-actions';
    const edit = document.createElement('button'); edit.className = 'mini-btn'; edit.textContent = 'ویرایش'; edit.addEventListener('click', () => openEditor(p));
    const toggle = document.createElement('button'); toggle.className = 'mini-btn'; toggle.textContent = p.is_active ? 'غیرفعال‌کردن' : 'فعال‌کردن'; toggle.addEventListener('click', () => toggleProduct(p));
    const del = document.createElement('button'); del.className = 'mini-btn delete'; del.textContent = 'حذف'; del.addEventListener('click', () => deleteProduct(p));
    actionBox.append(edit, toggle, del); actions.append(actionBox);
    tr.append(productTd, category, price, stock, status, actions); productsBody.append(tr);
  });
}
function makeFallback(symbol) {
  const el = document.createElement('div'); el.className = 'product-thumb product-thumb-fallback'; el.textContent = symbol || 'M'; return el;
}
function categoryName(value) {
  return ({ charging: 'شارژ و برق', peripherals: 'لوازم جانبی', connectivity: 'اتصال و تبدیل', other: 'سایر' })[value] || 'سایر';
}
function openEditor(product = null) {
  productForm.reset();
  $('productId').value = product?.id ?? '';
  $('modalTitle').textContent = product ? 'ویرایش محصول' : 'افزودن محصول';
  $('productName').value = product?.name || '';
  $('productDescription').value = product?.description || '';
  $('productPrice').value = product?.price ?? '';
  $('productStock').value = product?.stock ?? 0;
  $('productImage').value = product?.image_url || '';
  $('productCategory').value = product?.category || 'other';
  $('productSymbol').value = product?.symbol || 'MOON';
  $('productActive').checked = product ? Boolean(product.is_active) : true;
  message($('formMessage'), '');
  modal.classList.remove('hidden');
}
function closeEditor() { modal.classList.add('hidden'); }
$('addButton').addEventListener('click', () => openEditor());
$('closeModal').addEventListener('click', closeEditor);
$('cancelButton').addEventListener('click', closeEditor);
modal.addEventListener('click', event => { if (event.target === modal) closeEditor(); });
$('searchInput').addEventListener('input', renderProducts);
$('refreshButton').addEventListener('click', loadProducts);

productForm.addEventListener('submit', async event => {
  event.preventDefault();
  const id = $('productId').value;
  const payload = {
    name: $('productName').value.trim(),
    description: $('productDescription').value.trim() || null,
    price: Number($('productPrice').value),
    currency: 'TOMAN',
    stock: Number($('productStock').value),
    image_url: $('productImage').value.trim() || null,
    category: $('productCategory').value,
    category_label: categoryName($('productCategory').value),
    symbol: $('productSymbol').value.trim() || 'MOON',
    is_active: $('productActive').checked
  };
  if (!payload.name || !Number.isFinite(payload.price) || payload.price < 0 || !Number.isInteger(payload.stock) || payload.stock < 0) {
    message($('formMessage'), 'نام، قیمت و موجودی را به‌درستی وارد کنید.');
    return;
  }
  const save = $('saveButton'); save.disabled = true; save.textContent = 'در حال ذخیره…';
  const result = id
    ? await supabase.from('products').update(payload).eq('id', id)
    : await supabase.from('products').insert(payload);
  save.disabled = false; save.textContent = 'ذخیره محصول';
  if (result.error) {
    message($('formMessage'), 'ذخیره انجام نشد: ' + result.error.message);
    return;
  }
  closeEditor();
  message(workspaceMessage, id ? 'تغییرات محصول ذخیره شد.' : 'محصول جدید اضافه شد.', true);
  await loadProducts();
});
async function toggleProduct(product) {
  const { error } = await supabase.from('products').update({ is_active: !product.is_active }).eq('id', product.id);
  if (error) { message(workspaceMessage, 'تغییر وضعیت ناموفق بود: ' + error.message); return; }
  await loadProducts();
}
async function deleteProduct(product) {
  if (!window.confirm('محصول «' + product.name + '» برای همیشه حذف شود؟')) return;
  const { error } = await supabase.from('products').delete().eq('id', product.id);
  if (error) { message(workspaceMessage, 'حذف انجام نشد: ' + error.message); return; }
  await loadProducts();
}
await checkAdmin();
