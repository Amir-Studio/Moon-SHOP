// ============================================================
// MOON SHOP — main.js (با پنل مدیریت ساده)
// ============================================================

// ===== رمز مدیریت =====
const ADMIN_PASSWORD = 'moon123';
const ADMIN_SECRET = 'moon-secret';

const hamburger = document.getElementById('hamburger');
const drawer = document.getElementById('mobileDrawer');
const drawerOverlay = document.getElementById('drawerOverlay');
const drawerClose = document.getElementById('drawerClose');
const categoryTabs = document.querySelectorAll('.category-tab');
const accountsGrid = document.getElementById('accountsGrid');

// ============================================================
// توابع منو
// ============================================================
function openDrawer() {
    drawer.classList.add('open');
    drawerOverlay.classList.add('visible');
    hamburger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
}
function closeDrawer() {
    drawer.classList.remove('open');
    drawerOverlay.classList.remove('visible');
    hamburger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
}
hamburger.addEventListener('click', () => {
    drawer.classList.contains('open') ? closeDrawer() : openDrawer();
});
drawerClose.addEventListener('click', closeDrawer);
drawerOverlay.addEventListener('click', closeDrawer);
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer.classList.contains('open')) closeDrawer();
});

// ============================================================
// CONFIG
// ============================================================
const API_BASE_URL = 'https://gonzoo.kabiri1489.workers.dev';
const MAX_IMAGE_SIZE = 100 * 1024 * 1024;

// ============================================================
// LOAD ACCOUNTS
// ============================================================
async function loadAccounts() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/accounts`);
        if (response.ok) {
            const result = await response.json();
            if (result.success && result.data && result.data.length > 0) {
                localStorage.setItem('moonShopAccounts', JSON.stringify(result.data));
                console.log('📡 داده‌ها از Worker بارگذاری شد.');
                return result.data;
            }
        }
    } catch (err) {
        console.warn('⚠️ Worker در دسترس نیست:', err.message);
    }
    try {
        const res = await fetch('data/accounts.json');
        if (res.ok) {
            const data = await res.json();
            localStorage.setItem('moonShopAccounts', JSON.stringify(data));
            console.log('📂 داده‌ها از فایل محلی بارگذاری شد.');
            return data;
        }
    } catch (err) {}
    const cached = localStorage.getItem('moonShopAccounts');
    if (cached) {
        try {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch (e) {}
    }
    const fallback = [
        { id: "AK-001", title: "اکانت ۱", description: "نیم سیف", price: 150000, images: ["assets/images/accounts/1.jpg"] },
        { id: "AK-002", title: "اکانت ۲", description: "نیم سیف", price: 150000, images: ["assets/images/accounts/2.jpg"] },
        { id: "AK-003", title: "اکانت ۳", description: "نیم سیف", price: 200000, images: ["assets/images/accounts/3.jpg"] },
        { id: "AK-004", title: "اکانت ۴", description: "نیم سیف", price: 100000, images: ["assets/images/accounts/4.jpg"] },
        { id: "AK-005", title: "اکانت ۵", description: "نیم سیف", price: 200000, images: ["assets/images/accounts/5.jpg"] }
    ];
    localStorage.setItem('moonShopAccounts', JSON.stringify(fallback));
    return fallback;
}

// ============================================================
// RENDER ACCOUNTS
// ============================================================
function renderAccounts(accounts) {
    if (!accounts || accounts.length === 0) {
        accountsGrid.innerHTML = `<p style="text-align:center;color:#666;padding:40px 0;">هیچ اکانتی موجود نیست.</p>`;
        return;
    }
    accountsGrid.innerHTML = accounts.map(acc => {
        const imgSrc = (acc.images && acc.images.length > 0) ? acc.images[0] : 'assets/images/accounts/placeholder.webp';
        return `
            <article class="account-card" data-account-id="${acc.id}">
                <div class="account-card-image">
                    <img src="${imgSrc}" alt="${acc.title}" loading="eager" />
                </div>
                <div class="account-card-body">
                    <span class="account-card-id">${acc.id}</span>
                    <h3 class="account-card-title">${acc.title}</h3>
                    <div class="account-card-description">${acc.description || ''}</div>
                    <div class="account-card-price">${(acc.price || 0).toLocaleString()} تومان</div>
                    <button class="btn btn-primary" data-account-id="${acc.id}">مشاهده جزئیات</button>
                </div>
            </article>
        `;
    }).join('');
    attachCardClickHandlers();
    updateAccountCount();
}

function updateAccountCount() {
    const countEl = document.getElementById('accountCount');
    if (countEl && typeof allAccounts !== 'undefined') {
        countEl.textContent = allAccounts.length;
    }
}

let allAccounts = [];

function filterAccounts(filter) {
    let filtered = [...allAccounts];
    if (filter === 'mythic') {
        filtered = filtered.filter(a => a.mythic && a.mythic >= 3);
    } else if (filter === 'legendary') {
        filtered = filtered.filter(a => a.legendary && a.legendary >= 8);
    } else if (filter === 'highcp') {
        filtered = filtered.filter(a => a.cp && a.cp >= 15000);
    }
    renderAccounts(filtered);
}

// ============================================================
// INIT
// ============================================================
(async function init() {
    allAccounts = await loadAccounts();
    renderAccounts(allAccounts);
    categoryTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            categoryTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            filterAccounts(tab.dataset.filter);
        });
    });
})();

// ============================================================
// ENTRY HERO → HOME TRANSITION
// ============================================================
const entryHero = document.getElementById('entry-hero');
const mainContent = document.getElementById('main-content');
const showHomeBtn = document.getElementById('showHomeBtn');
let isTransitioning = false;
function goToHome() {
    if (isTransitioning) return;
    if (!entryHero || !mainContent) return;
    isTransitioning = true;
    entryHero.classList.add('fade-out');
    mainContent.classList.remove('hidden');
    mainContent.classList.add('showing');
    setTimeout(() => {
        mainContent.classList.add('visible');
        document.body.style.overflow = '';
    }, 550);
    setTimeout(() => {
        entryHero.style.display = 'none';
        isTransitioning = false;
    }, 700);
}
if (showHomeBtn) {
    showHomeBtn.addEventListener('click', function(e) {
        e.preventDefault();
        goToHome();
    });
}
setTimeout(goToHome, 4000);

// ============================================================
// ACCOUNT DETAIL MODAL
// ============================================================
const modal = document.getElementById('accountModal');
const modalClose = document.getElementById('modalClose');
const modalGallery = document.getElementById('modalGallery');
const modalInfo = document.getElementById('modalInfo');
const lightbox = document.getElementById('lightbox');
const lightboxClose = document.getElementById('lightboxClose');
const lightboxImage = document.getElementById('lightboxImage');
let isModalOpen = false;
let isLightboxOpen = false;
let lastFocusedElement = null;
let currentAccount = null;

function renderGallery(images) {
    if (!images || images.length === 0) {
        return '<p style="color:#666;text-align:center;padding:20px 0;">تصویری موجود نیست</p>';
    }
    const firstImage = images[0];
    return `
        <div class="modal-gallery single-image">
            <div class="gallery-item" data-src="${firstImage}">
                <img src="${firstImage}" alt="تصویر اکانت" loading="eager" />
            </div>
        </div>
    `;
}
function renderInfo(account) {
    if (!account) return '';
    return `
        <div class="modal-info-simple">
            <h3 class="modal-account-title">${account.title}</h3>
            <div class="modal-details">
                <div class="modal-detail-item">
                    <span class="modal-detail-label">توضیحات</span>
                    <span class="modal-detail-value">${account.description || '—'}</span>
                </div>
                <div class="modal-detail-item">
                    <span class="modal-detail-label">قیمت</span>
                    <span class="modal-detail-value price">${(account.price || 0).toLocaleString()} تومان</span>
                </div>
            </div>
        </div>
    `;
}
function openModal(account) {
    if (!account) return;
    currentAccount = account;
    lastFocusedElement = document.activeElement;
    modalGallery.innerHTML = renderGallery(account.images || []);
    modalInfo.innerHTML = renderInfo(account);
    const buyBtn = document.getElementById('buyDirectBtn');
    if (buyBtn) {
        const newBtn = buyBtn.cloneNode(true);
        buyBtn.parentNode.replaceChild(newBtn, buyBtn);
        newBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            closeModal();
            sessionStorage.setItem('checkoutAccount', JSON.stringify(account));
            window.location.href = `checkout.html?id=${account.id}`;
        });
    }
    document.querySelectorAll('.gallery-item').forEach(item => {
        const newItem = item.cloneNode(true);
        item.parentNode.replaceChild(newItem, item);
        newItem.addEventListener('click', function(e) {
            if (e.target.closest('.btn') || e.target.closest('#buyDirectBtn')) return;
            e.stopPropagation();
            const src = this.dataset.src;
            if (src) openLightbox(src);
        });
    });
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    isModalOpen = true;
    setTimeout(() => modalClose.focus(), 100);
}
function closeModal() {
    modal.classList.remove('active');
    document.body.style.overflow = '';
    isModalOpen = false;
    if (lastFocusedElement) {
        lastFocusedElement.focus();
        lastFocusedElement = null;
    }
    currentAccount = null;
}
function openLightbox(src) {
    if (!src) return;
    lightboxImage.src = src;
    lightbox.classList.add('active');
    isLightboxOpen = true;
    document.body.style.overflow = 'hidden';
    setTimeout(() => lightboxClose.focus(), 100);
}
function closeLightbox() {
    lightbox.classList.remove('active');
    isLightboxOpen = false;
    document.body.style.overflow = isModalOpen ? 'hidden' : '';
    if (isModalOpen) setTimeout(() => modalClose.focus(), 100);
}
modalClose.addEventListener('click', closeModal);
modal.addEventListener('click', function(e) { if (e.target === modal) closeModal(); });
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        if (isLightboxOpen) closeLightbox();
        else if (isModalOpen) closeModal();
    }
});
lightboxClose.addEventListener('click', closeLightbox);
lightbox.addEventListener('click', function(e) { if (e.target === lightbox) closeLightbox(); });

function attachCardClickHandlers() {
    document.querySelectorAll('.account-card').forEach(card => {
        if (card.dataset.listener === 'true') return;
        card.dataset.listener = 'true';
        const account = allAccounts.find(a => a.id === card.dataset.accountId);
        if (!account) return;
        card.addEventListener('click', function(e) {
            if (e.target.closest('.btn')) return;
            openModal(account);
        });
        const btn = card.querySelector('.btn-primary');
        if (btn) {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                openModal(account);
            });
        }
    });
}

// ============================================================
// SUPPORT COPY
// ============================================================
function copySupportId(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            const btn = document.querySelector('.btn-copy-support');
            const original = btn.textContent;
            btn.textContent = '✓ کپی شد';
            setTimeout(() => { btn.textContent = original; }, 2000);
        }).catch(() => fallbackCopy(text));
    } else {
        fallbackCopy(text);
    }
}
function fallbackCopy(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
        document.execCommand('copy');
        const btn = document.querySelector('.btn-copy-support');
        const original = btn.textContent;
        btn.textContent = '✓ کپی شد';
        setTimeout(() => { btn.textContent = original; }, 2000);
    } catch (err) {
        alert('لطفاً آیدی را دستی کپی کنید: ' + text);
    }
    document.body.removeChild(textarea);
}
window.copySupportId = copySupportId;

// ============================================================
// ==================== پنل مدیریت (ساده) ====================
// ============================================================

const adminLoginBtn = document.getElementById('adminLoginBtn');
const adminLoginBtnMobile = document.getElementById('adminLoginBtnMobile');
const adminLoginModal = document.getElementById('adminLoginModal');
const adminLoginClose = document.getElementById('adminLoginClose');
const adminCodeInput = document.getElementById('adminCodeInput');
const adminCodeSubmit = document.getElementById('adminCodeSubmit');
const adminLoginError = document.getElementById('adminLoginError');
const adminPanel = document.getElementById('adminPanel');
const adminPanelClose = document.getElementById('adminPanelClose');

let adminToken = sessionStorage.getItem('adminToken') || null;

function openAdminLogin() {
    adminLoginModal.classList.add('active');
    adminCodeInput.value = '';
    adminLoginError.classList.remove('show');
    adminCodeInput.focus();
}
function closeAdminLogin() {
    adminLoginModal.classList.remove('active');
}
function openAdminPanel() {
    adminPanel.classList.add('active');
    renderAdminAccounts();
    loadAdminConfig();
    document.body.style.overflow = 'hidden';
    setTimeout(addSaveServerButton, 100);
}
function closeAdminPanel() {
    adminPanel.classList.remove('active');
    document.body.style.overflow = '';
    (async function() {
        allAccounts = await loadAccounts();
        renderAccounts(allAccounts);
    })();
}

if (adminLoginBtn) adminLoginBtn.addEventListener('click', openAdminLogin);
if (adminLoginBtnMobile) adminLoginBtnMobile.addEventListener('click', openAdminLogin);
if (adminLoginClose) adminLoginClose.addEventListener('click', closeAdminLogin);
if (adminPanelClose) adminPanelClose.addEventListener('click', closeAdminPanel);

adminCodeSubmit.addEventListener('click', async function() {
    const code = adminCodeInput.value.trim();
    if (!code) {
        adminLoginError.textContent = 'لطفاً کد را وارد کنید.';
        adminLoginError.classList.add('show');
        return;
    }
    if (code !== ADMIN_PASSWORD) {
        adminLoginError.textContent = 'کد مدیریت اشتباه است.';
        adminLoginError.classList.add('show');
        adminCodeInput.value = '';
        adminCodeInput.focus();
        return;
    }
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: ADMIN_SECRET })
        });
        const result = await response.json();
        if (result.success && result.token) {
            adminToken = result.token;
            sessionStorage.setItem('adminToken', adminToken);
        } else {
            throw new Error(result.error || 'توکن دریافت نشد');
        }
    } catch (err) {
        console.warn('⚠️ خطا در دریافت توکن:', err.message);
        adminToken = 'admin-token-' + Date.now();
        sessionStorage.setItem('adminToken', adminToken);
        alert('⚠️ ارتباط با سرور برقرار نشد، اما با توکن موقت وارد شدید. ممکن است ذخیره‌سازی روی گیت‌هاب کار نکند.');
    }
    closeAdminLogin();
    openAdminPanel();
});
adminCodeInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') adminCodeSubmit.click();
});
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        if (adminLoginModal.classList.contains('active')) closeAdminLogin();
        if (adminPanel.classList.contains('active')) closeAdminPanel();
    }
});

// ===== تنظیمات (ساده) =====
const adminAccountsList = document.getElementById('adminAccountsList');
const adminAddAccountBtn = document.getElementById('adminAddAccountBtn');
const adminCardNumber = document.getElementById('adminCardNumber');
const adminSoroushId = document.getElementById('adminSoroushId');
const adminSaveCard = document.getElementById('adminSaveCard');
const adminSaveSoroush = document.getElementById('adminSaveSoroush');

function loadAdminConfig() {
    adminCardNumber.value = CONFIG.cardNumber || '6219861956267685';
    adminSoroushId.value = CONFIG.adminSoroushId || '@Sjjshh';
}
adminSaveCard.addEventListener('click', function() {
    CONFIG.cardNumber = adminCardNumber.value.trim();
    const config = { cardNumber: CONFIG.cardNumber, adminSoroushId: CONFIG.adminSoroushId };
    localStorage.setItem('moonShopConfig', JSON.stringify(config));
    alert('شماره کارت در localStorage ذخیره شد. برای ذخیره روی سرور، دکمه پایین را بزنید.');
});
adminSaveSoroush.addEventListener('click', function() {
    CONFIG.adminSoroushId = adminSoroushId.value.trim();
    document.getElementById('supportAdminId').textContent = CONFIG.adminSoroushId;
    const config = { cardNumber: CONFIG.cardNumber, adminSoroushId: CONFIG.adminSoroushId };
    localStorage.setItem('moonShopConfig', JSON.stringify(config));
    alert('آیدی سروش‌پلاس در localStorage ذخیره شد. برای ذخیره روی سرور، دکمه پایین را بزنید.');
});

function addSaveServerButton() {
    if (document.getElementById('adminSaveServerBtn')) return;
    const saveBtn = document.createElement('button');
    saveBtn.id = 'adminSaveServerBtn';
    saveBtn.className = 'admin-save-server';
    saveBtn.innerHTML = '💾 ذخیره همه تغییرات روی سرور (GitHub)';
    saveBtn.addEventListener('click', saveAllToServer);
    document.querySelector('.admin-panel').appendChild(saveBtn);
}

async function uploadImage(file) {
    if (!adminToken) {
        alert('لطفاً ابتدا وارد پنل مدیریت شوید.');
        return null;
    }
    if (file.size > MAX_IMAGE_SIZE) {
        const sizeInMB = (file.size / (1024 * 1024)).toFixed(1);
        alert(`❌ حجم عکس (${sizeInMB} مگابایت) بیشتر از حد مجاز (۱۰۰ مگابایت) است.`);
        return null;
    }
    const reader = new FileReader();
    const base64 = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
    try {
        const response = await fetch(`${API_BASE_URL}/api/upload`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${ADMIN_SECRET}`
            },
            body: JSON.stringify({ image: base64, fileName: file.name })
        });
        const result = await response.json();
        if (!result.success) throw new Error(result.error || 'خطا در آپلود عکس');
        return result.data.path;
    } catch (err) {
        alert('خطا در آپلود عکس: ' + err.message);
        return null;
    }
}

async function saveAllToServer() {
    const btn = document.getElementById('adminSaveServerBtn');
    if (!btn) return;
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '⏳ در حال ذخیره‌سازی...';
    try {
        if (!adminToken) {
            throw new Error('لطفاً ابتدا وارد پنل مدیریت شوید.');
        }
        const accounts = allAccounts;
        localStorage.setItem('moonShopAccounts', JSON.stringify(accounts));
        const response = await fetch(`${API_BASE_URL}/api/accounts`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${ADMIN_SECRET}`
            },
            body: JSON.stringify({ data: accounts })
        });
        const result = await response.json();
        if (!result.success) throw new Error(result.error || 'خطا در ذخیره اکانت‌ها');
        const config = {
            cardNumber: CONFIG.cardNumber,
            adminSoroushId: CONFIG.adminSoroushId
        };
        const configResponse = await fetch(`${API_BASE_URL}/api/config`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${ADMIN_SECRET}`
            },
            body: JSON.stringify({ data: config })
        });
        const configResult = await configResponse.json();
        if (!configResult.success) throw new Error(configResult.error || 'خطا در ذخیره تنظیمات');
        btn.innerHTML = '✅ ذخیره شد!';
        alert('✅ همه تغییرات با موفقیت روی GitHub ذخیره شد.');
    } catch (err) {
        btn.innerHTML = '❌ خطا: ' + err.message;
        alert('❌ خطا در ذخیره‌سازی: ' + err.message);
    } finally {
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }, 3000);
    }
}

function renderAdminAccounts() {
    const accounts = allAccounts;
    if (!accounts || accounts.length === 0) {
        adminAccountsList.innerHTML = '<p style="color:var(--color-text-muted);padding:20px 0;text-align:center;">هیچ اکانتی وجود ندارد.</p>';
        return;
    }
    adminAccountsList.innerHTML = accounts.map(acc => `
        <div class="admin-account-item" data-id="${acc.id}">
            <div class="admin-account-info">
                <span class="admin-account-id">${acc.id}</span>
                <span class="admin-account-title">${acc.title}</span>
                <span class="admin-account-desc">${acc.description || ''}</span>
                <span class="admin-account-price">${(acc.price || 0).toLocaleString()} تومان</span>
            </div>
            <div class="admin-account-actions">
                <button class="admin-edit-btn" data-id="${acc.id}">✏️ ویرایش</button>
                <button class="admin-delete-btn" data-id="${acc.id}">🗑️ حذف</button>
            </div>
        </div>
    `).join('');
    document.querySelectorAll('.admin-edit-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.dataset.id;
            openAdminForm(id);
        });
    });
    document.querySelectorAll('.admin-delete-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.dataset.id;
            if (confirm(`آیا از حذف اکانت ${id} مطمئن هستید؟`)) {
                deleteAccount(id);
            }
        });
    });
}

function deleteAccount(id) {
    allAccounts = allAccounts.filter(a => a.id !== id);
    localStorage.setItem('moonShopAccounts', JSON.stringify(allAccounts));
    renderAccounts(allAccounts);
    renderAdminAccounts();
    alert(`اکانت ${id} حذف شد. برای ذخیره روی سرور، دکمه پایین را بزنید.`);
}

// ===== فرم افزودن/ویرایش اکانت =====
const adminFormOverlay = document.getElementById('adminAccountForm');
const adminFormClose = document.getElementById('adminFormClose');
const adminFormTitle = document.getElementById('adminFormTitle');
const adminFormEditId = document.getElementById('adminFormEditId');
const adminFormId = document.getElementById('adminFormId');
const adminFormTitleInput = document.getElementById('adminFormTitleInput');
const adminFormDescription = document.getElementById('adminFormDescription');
const adminFormPrice = document.getElementById('adminFormPrice');
const adminFormImage1 = document.getElementById('adminFormImage1');
const adminFormFileInput = document.getElementById('adminFormFileInput');
const adminFormUploadStatus = document.getElementById('adminFormUploadStatus');
const adminFormSave = document.getElementById('adminFormSave');
const adminFormCancel = document.getElementById('adminFormCancel');

function openAdminForm(editId = null) {
    adminFormOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    if (editId) {
        adminFormTitle.textContent = 'ویرایش اکانت';
        const acc = allAccounts.find(a => a.id === editId);
        if (acc) {
            adminFormEditId.value = acc.id;
            adminFormId.value = acc.id;
            adminFormId.disabled = true;
            adminFormTitleInput.value = acc.title || '';
            adminFormDescription.value = acc.description || '';
            adminFormPrice.value = acc.price || '';
            adminFormImage1.value = (acc.images && acc.images[0]) || '';
        }
    } else {
        adminFormTitle.textContent = 'افزودن اکانت جدید';
        adminFormEditId.value = '';
        adminFormId.disabled = false;
        adminFormId.value = '';
        adminFormTitleInput.value = '';
        adminFormDescription.value = '';
        adminFormPrice.value = '';
        adminFormImage1.value = '';
    }
    adminFormFileInput.value = '';
    adminFormUploadStatus.textContent = '';
    adminFormUploadStatus.style.color = '';
}
function closeAdminForm() {
    adminFormOverlay.classList.remove('active');
    document.body.style.overflow = '';
}
adminAddAccountBtn.addEventListener('click', () => openAdminForm());
adminFormClose.addEventListener('click', closeAdminForm);
adminFormCancel.addEventListener('click', closeAdminForm);

adminFormFileInput.addEventListener('change', async function() {
    const file = this.files[0];
    if (!file) return;
    adminFormUploadStatus.textContent = '⏳ در حال آپلود...';
    adminFormUploadStatus.style.color = '#f0f6fc';
    const path = await uploadImage(file);
    if (path) {
        adminFormImage1.value = path;
        adminFormUploadStatus.textContent = '✅ عکس با موفقیت آپلود شد';
        adminFormUploadStatus.style.color = '#10B981';
    } else {
        adminFormUploadStatus.textContent = '❌ خطا در آپلود عکس';
        adminFormUploadStatus.style.color = '#EF4444';
        this.value = '';
    }
});

adminFormSave.addEventListener('click', function() {
    const id = adminFormId.value.trim();
    if (!id) {
        alert('لطفاً آیدی اکانت را وارد کنید.');
        return;
    }
    const title = adminFormTitleInput.value.trim() || 'اکانت جدید';
    const description = adminFormDescription.value.trim() || '';
    const price = parseInt(adminFormPrice.value) || 0;
    const image1 = adminFormImage1.value.trim() || '';
    const images = image1 ? [image1] : ['assets/images/accounts/placeholder.webp'];
    const accountData = { id, title, description, price, images };
    const editId = adminFormEditId.value;
    if (editId) {
        const index = allAccounts.findIndex(a => a.id === editId);
        if (index !== -1) {
            if (editId !== id) {
                allAccounts = allAccounts.filter(a => a.id !== editId);
                allAccounts.push(accountData);
            } else {
                allAccounts[index] = accountData;
            }
        }
    } else {
        if (allAccounts.find(a => a.id === id)) {
            alert('این آیدی قبلاً وجود دارد!');
            return;
        }
        allAccounts.push(accountData);
    }
    localStorage.setItem('moonShopAccounts', JSON.stringify(allAccounts));
    renderAccounts(allAccounts);
    renderAdminAccounts();
    closeAdminForm();
    alert(`اکانت ${id} در localStorage ذخیره شد. برای ذخیره روی سرور، دکمه پایین را بزنید.`);
});

console.log('✅ MOON SHOP loaded (پنل مدیریت ساده).');