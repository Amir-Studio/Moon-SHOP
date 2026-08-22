// ============================================================
// MOON SHOP — main.js (نسخه نهایی و کامل)
// ============================================================

// ===== رمز مدیریت =====
const ADMIN_PASSWORD = 'moon123';
const ADMIN_SECRET = 'moon-secret';

// ===== استفاده از LocalWorker =====
const USE_LOCAL_WORKER = true;

// ============================================================
// LocalWorker (با مدیریت خطا و retry)
// ============================================================
const GITHUB_TOKEN = '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';
const REPO_OWNER = 'Amir-Studio';
const REPO_NAME = 'Moon-SHOP'; // ✅ اسم مخزن درست
const BRANCH = 'main';
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry(url, options, retries = MAX_RETRIES) {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url, options);
            if (response.status === 403 || response.status === 429) {
                const waitTime = (i + 1) * RETRY_DELAY;
                console.log(`⏳ Rate Limit، ${waitTime}ms صبر کن...`);
                await sleep(waitTime);
                continue;
            }
            return response;
        } catch (err) {
            if (i === retries - 1) throw err;
            console.log(`⏳ تلاش مجدد ${i+1}/${retries}...`);
            await sleep(RETRY_DELAY);
        }
    }
    throw new Error('Max retries exceeded');
}

async function getFileContentString(path) {
    const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}?ref=${BRANCH}`;
    const response = await fetchWithRetry(url, {
        headers: {
            'Authorization': `Bearer ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json'
        }
    });
    if (response.status === 404) return null;
    if (!response.ok) {
        const error = await response.text();
        throw new Error(`GitHub API error (${response.status}): ${error}`);
    }
    const data = await response.json();
    return decodeURIComponent(escape(atob(data.content)));
}

async function updateFileContent(path, content) {
    const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`;
    const existing = await fetchWithRetry(url, {
        headers: {
            'Authorization': `Bearer ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json'
        }
    });
    let sha = null;
    if (existing.ok) {
        const data = await existing.json();
        sha = data.sha;
    }
    const body = {
        message: `Update ${path}`,
        content: btoa(unescape(encodeURIComponent(content))),
        branch: BRANCH
    };
    if (sha) body.sha = sha;
    const response = await fetchWithRetry(url, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });
    if (!response.ok) {
        const error = await response.text();
        throw new Error(`GitHub API error (${response.status}): ${error}`);
    }
    return await response.json();
}

// ============================================================
// هندلرهای API با fallback به localStorage
// ============================================================
async function handleGetAccounts() {
    try {
        const content = await getFileContentString('data/accounts.json');
        if (!content) throw new Error('accounts.json not found');
        const data = JSON.parse(content);
        localStorage.setItem('moonShopAccountsBackup', JSON.stringify(data));
        return { success: true, data };
    } catch (e) {
        console.warn('⚠️ خطا در دریافت از گیت‌هاب، استفاده از backup:', e.message);
        const backup = localStorage.getItem('moonShopAccountsBackup');
        if (backup) {
            try {
                const data = JSON.parse(backup);
                return { success: true, data, fromBackup: true };
            } catch (err) {}
        }
        return { success: false, error: e.message };
    }
}

async function handleUpdateAccounts(data) {
    try {
        const content = JSON.stringify(data, null, 2);
        await updateFileContent('data/accounts.json', content);
        localStorage.setItem('moonShopAccountsBackup', JSON.stringify(data));
        return { success: true, message: 'Accounts updated successfully' };
    } catch (e) {
        console.warn('⚠️ ذخیره روی گیت‌هاب失败، ذخیره در localStorage:', e.message);
        localStorage.setItem('moonShopAccountsPending', JSON.stringify(data));
        return { success: false, error: e.message, pending: true };
    }
}

async function handleGetConfig() {
    try {
        const content = await getFileContentString('js/config.js');
        if (!content) throw new Error('config.js not found');
        const configMatch = content.match(/const CONFIG = ({[\s\S]*?});/);
        if (!configMatch) throw new Error('CONFIG not found');
        const config = new Function('return ' + configMatch[1])();
        localStorage.setItem('moonShopConfigBackup', JSON.stringify(config));
        return { success: true, data: config };
    } catch (e) {
        console.warn('⚠️ خطا در دریافت config، استفاده از backup:', e.message);
        const backup = localStorage.getItem('moonShopConfigBackup');
        if (backup) {
            try {
                return { success: true, data: JSON.parse(backup), fromBackup: true };
            } catch (err) {}
        }
        return { success: false, error: e.message };
    }
}

async function handleUpdateConfig(config) {
    try {
        const content = `// ============================================================\n// CONFIG — تنظیمات قابل تغییر توسط صاحب سایت\n// ============================================================\nconst CONFIG = ${JSON.stringify(config, null, 2)};\n`;
        await updateFileContent('js/config.js', content);
        localStorage.setItem('moonShopConfigBackup', JSON.stringify(config));
        return { success: true, message: 'Config updated successfully' };
    } catch (e) {
        console.warn('⚠️ ذخیره config روی گیت‌هاب失败:', e.message);
        localStorage.setItem('moonShopConfigPending', JSON.stringify(config));
        return { success: false, error: e.message, pending: true };
    }
}

async function handleUploadImage(imageData, fileName) {
    try {
        const sizeInBytes = Math.ceil((imageData.length * 3) / 4);
        if (sizeInBytes > 100 * 1024 * 1024) throw new Error('Image size exceeds 100 MB limit.');
        const timestamp = Date.now();
        const ext = fileName.includes('.') ? fileName.split('.').pop() : 'jpg';
        const cleanFileName = fileName.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9\-_]/g, '_');
        const newFileName = `${cleanFileName}_${timestamp}.${ext}`;
        const path = `assets/images/accounts/${newFileName}`;
        const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`;
        const body = { message: `Upload image: ${newFileName}`, content: imageData, branch: BRANCH };
        const response = await fetchWithRetry(url, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });
        if (!response.ok) {
            const error = await response.text();
            throw new Error(`GitHub API error (${response.status}): ${error}`);
        }
        return { success: true, path: `assets/images/accounts/${newFileName}` };
    } catch (e) {
        return { success: false, error: e.message };
    }
}

async function localApiRequest(method, path, body = null) {
    try {
        if (path === '/api/admin/login') {
            const { code } = body;
            if (code === ADMIN_SECRET) return { success: true, token: 'local-token-' + Date.now() };
            return { success: false, error: 'Invalid admin code' };
        }
        if (path === '/api/upload' && method === 'POST') {
            const { image, fileName } = body;
            return await handleUploadImage(image, fileName);
        }
        if (path === '/api/accounts' && method === 'GET') return await handleGetAccounts();
        if (path === '/api/accounts' && method === 'PUT') return await handleUpdateAccounts(body.data);
        if (path === '/api/config' && method === 'GET') return await handleGetConfig();
        if (path === '/api/config' && method === 'PUT') return await handleUpdateConfig(body.data);
        return { success: false, error: `Endpoint ${path} not found` };
    } catch (e) {
        return { success: false, error: e.message };
    }
}

async function apiRequest(method, path, body = null) {
    if (USE_LOCAL_WORKER) {
        const result = await localApiRequest(method, path, body);
        return {
            ok: result.success,
            json: async () => result
        };
    }
    const url = `https://gonzoo.kabiri1489.workers.dev${path}`;
    const options = { method, headers: { 'Content-Type': 'application/json' } };
    if (body) options.body = JSON.stringify(body);
    const response = await fetch(url, options);
    return response;
}

// ============================================================
// عناصر DOM و منو
// ============================================================
const hamburger = document.getElementById('hamburger');
const drawer = document.getElementById('mobileDrawer');
const drawerOverlay = document.getElementById('drawerOverlay');
const drawerClose = document.getElementById('drawerClose');
const categoryTabs = document.querySelectorAll('.category-tab');
const accountsGrid = document.getElementById('accountsGrid');

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
const MAX_IMAGE_SIZE = 100 * 1024 * 1024;

// ============================================================
// LOAD ACCOUNTS
// ============================================================
async function loadAccounts() {
    try {
        const response = await apiRequest('GET', '/api/accounts');
        const result = await response.json();
        if (result.success && result.data && result.data.length > 0) {
            localStorage.setItem('moonShopAccounts', JSON.stringify(result.data));
            console.log('📡 داده‌ها بارگذاری شد.');
            return result.data;
        }
    } catch (err) {
        console.warn('⚠️ خطا در بارگذاری:', err.message);
    }
    try {
        const res = await fetch('data/accounts.json');
        if (res.ok) {
            const data = await res.json();
            localStorage.setItem('moonShopAccounts', JSON.stringify(data));
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
    if (images.length === 1) {
        return `
            <div class="modal-gallery single-image">
                <div class="gallery-item" data-src="${images[0]}">
                    <img src="${images[0]}" alt="تصویر اکانت" loading="eager" />
                </div>
            </div>
        `;
    }
    return `
        <div class="modal-gallery multi-image">
            <div class="gallery-main">
                <img src="${images[0]}" alt="تصویر اصلی" id="galleryMainImg" />
            </div>
            <div class="gallery-thumbs">
                ${images.map((img, i) => `
                    <div class="gallery-thumb ${i === 0 ? 'active' : ''}" data-src="${img}">
                        <img src="${img}" alt="تصویر ${i+1}" loading="lazy" />
                    </div>
                `).join('')}
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
    
    document.querySelectorAll('.gallery-thumb').forEach(thumb => {
        thumb.addEventListener('click', function() {
            const src = this.dataset.src;
            if (src) {
                const mainImg = document.getElementById('galleryMainImg');
                if (mainImg) mainImg.src = src;
                document.querySelectorAll('.gallery-thumb').forEach(t => t.classList.remove('active'));
                this.classList.add('active');
            }
        });
    });
    
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
// ==================== پنل مدیریت ====================
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
        const response = await apiRequest('POST', '/api/admin/login', { code: ADMIN_SECRET });
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

// ===== تنظیمات =====
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

// ===== آپلود عکس =====
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
        const response = await apiRequest('POST', '/api/upload', {
            image: base64,
            fileName: file.name
        });
        const result = await response.json();
        if (!result.success) throw new Error(result.error || 'خطا در آپلود عکس');
        return result.path;
    } catch (err) {
        alert('خطا در آپلود عکس: ' + err.message);
        return null;
    }
}

// ===== ذخیره روی سرور =====
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
        
        const response = await apiRequest('PUT', '/api/accounts', { data: accounts });
        const result = await response.json();
        
        if (!result.success) {
            if (result.pending) {
                btn.innerHTML = '⚠️ ذخیره محلی شد!';
                alert('⚠️ ذخیره روی گیت‌هاب موقتاً ممکن نیست، اما تغییرات در مرورگر شما ذخیره شد.\n' +
                      'لطفاً بعداً دوباره امتحان کنید.');
                return;
            }
            throw new Error(result.error || 'خطا در ذخیره اکانت‌ها');
        }
        
        const config = {
            cardNumber: CONFIG.cardNumber,
            adminSoroushId: CONFIG.adminSoroushId
        };
        const configResponse = await apiRequest('PUT', '/api/config', { data: config });
        const configResult = await configResponse.json();
        
        if (!configResult.success) {
            if (configResult.pending) {
                alert('⚠️ تنظیمات در مرورگر ذخیره شد، اما روی گیت‌هاب موقتاً ثبت نشد.');
                return;
            }
            throw new Error(configResult.error || 'خطا در ذخیره تنظیمات');
        }
        
        btn.innerHTML = '✅ ذخیره شد!';
        alert('✅ همه تغییرات با موفقیت روی GitHub ذخیره شد.');
        
        allAccounts = await loadAccounts();
        renderAccounts(allAccounts);
        renderAdminAccounts();
        
    } catch (err) {
        console.error('Save error:', err);
        btn.innerHTML = '❌ خطا: ' + err.message;
        alert('❌ خطا در ذخیره‌سازی: ' + err.message + '\nتغییرات در مرورگر شما ذخیره شد.');
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
const adminFormImages = document.getElementById('adminFormImages');
const adminFormImageList = document.getElementById('adminFormImageList');
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
            if (acc.images && acc.images.length > 0) {
                adminFormImages.value = acc.images.join(',');
                adminFormImageList.innerHTML = acc.images.map((img, i) => `
                    <div style="font-size:12px;color:#8b949e;padding:2px 0;border-bottom:1px solid rgba(255,255,255,0.03);">
                        ${i+1}. ${img}
                    </div>
                `).join('');
            }
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
        adminFormImages.value = '';
        adminFormImageList.innerHTML = '';
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
    const files = this.files;
    if (!files || files.length === 0) return;
    
    let imagePaths = [];
    let failedCount = 0;
    adminFormUploadStatus.textContent = `⏳ در حال آپلود ${files.length} عکس...`;
    adminFormUploadStatus.style.color = '#f0f6fc';
    adminFormImageList.innerHTML = '';
    
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const path = await uploadImage(file);
        if (path) {
            imagePaths.push(path);
            const div = document.createElement('div');
            div.textContent = `✅ ${file.name}`;
            div.style.cssText = 'font-size:12px;color:#10B981;padding:2px 0;border-bottom:1px solid rgba(255,255,255,0.03);';
            adminFormImageList.appendChild(div);
        } else {
            failedCount++;
            const div = document.createElement('div');
            div.textContent = `❌ ${file.name} → آپلود نشد`;
            div.style.cssText = 'font-size:12px;color:#EF4444;padding:2px 0;border-bottom:1px solid rgba(255,255,255,0.03);';
            adminFormImageList.appendChild(div);
        }
    }
    
    adminFormImages.value = imagePaths.join(',');
    adminFormImage1.value = imagePaths.length > 0 ? imagePaths[0] : '';
    
    if (failedCount === 0) {
        adminFormUploadStatus.textContent = `✅ ${imagePaths.length} عکس با موفقیت آپلود شد`;
        adminFormUploadStatus.style.color = '#10B981';
    } else {
        adminFormUploadStatus.textContent = `⚠️ ${imagePaths.length} عکس آپلود شد، ${failedCount} عکس ناموفق`;
        adminFormUploadStatus.style.color = '#F59E0B';
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
    
    const imagesValue = adminFormImages.value;
    const images = imagesValue ? imagesValue.split(',') : ['assets/images/accounts/placeholder.webp'];
    
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
    alert(`✅ اکانت ${id} ذخیره شد. برای ذخیره روی سرور، دکمه پایین را بزنید.`);
});

// ============================================================
// بارگذاری اولیه (با پیام لودینگ)
// ============================================================
(async function init() {
    console.log('🔄 در حال بارگذاری داده‌ها...');
    const loadingMsg = document.createElement('div');
    loadingMsg.id = 'loadingMsg';
    loadingMsg.textContent = '⏳ در حال بارگذاری داده‌ها...';
    loadingMsg.style.cssText = 'text-align:center;padding:20px;color:#8b949e;';
    if (accountsGrid && accountsGrid.parentNode) {
        accountsGrid.parentNode.insertBefore(loadingMsg, accountsGrid);
    }
    
    try {
        allAccounts = await loadAccounts();
        if (allAccounts && allAccounts.length > 0) {
            renderAccounts(allAccounts);
        } else {
            const fallback = [
                { id: "AK-001", title: "اکانت ۱", description: "نیم سیف", price: 150000, images: ["assets/images/accounts/1.jpg"] },
                { id: "AK-002", title: "اکانت ۲", description: "نیم سیف", price: 150000, images: ["assets/images/accounts/2.jpg"] },
                { id: "AK-003", title: "اکانت ۳", description: "نیم سیف", price: 200000, images: ["assets/images/accounts/3.jpg"] },
                { id: "AK-004", title: "اکانت ۴", description: "نیم سیف", price: 100000, images: ["assets/images/accounts/4.jpg"] },
                { id: "AK-005", title: "اکانت ۵", description: "نیم سیف", price: 200000, images: ["assets/images/accounts/5.jpg"] }
            ];
            allAccounts = fallback;
            localStorage.setItem('moonShopAccounts', JSON.stringify(fallback));
            renderAccounts(fallback);
        }
    } catch (err) {
        console.error('Init error:', err);
    }
    
    const loadingEl = document.getElementById('loadingMsg');
    if (loadingEl) loadingEl.remove();
    
    categoryTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            categoryTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            filterAccounts(tab.dataset.filter);
        });
    });
})();

console.log('✅ MOON SHOP loaded (نسخه کامل با مدیریت خطا).');