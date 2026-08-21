// ============================================================
// MOON SHOP — main.js (نسخه نهایی با رفع کامل عکس بزرگ)
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
// ACCOUNT DETAIL MODAL (رفع کامل عکس بزرگ)
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

    // ===== دکمه خرید مستقیم (بدون تداخل با lightbox) =====
    const buyBtn = document.getElementById('buyDirectBtn');
    if (buyBtn) {
        // حذف تمام رویدادهای قبلی با clone
        const newBtn = buyBtn.cloneNode(true);
        buyBtn.parentNode.replaceChild(newBtn, buyBtn);
        // رویداد جدید با preventDefault و stopPropagation قوی
        newBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            closeModal();
            sessionStorage.setItem('checkoutAccount', JSON.stringify(account));
            window.location.href = `checkout.html?id=${account.id}`;
        });
        // غیرفعال کردن اشاره‌گر روی دکمه برای جلوگیری از رویدادهای والد
        newBtn.style.pointerEvents = 'auto';
    }

    // ===== رویداد کلیک روی تصویر (lightbox) با شرط =====
    document.querySelectorAll('.gallery-item').forEach(item => {
        // حذف رویدادهای قبلی
        const newItem = item.cloneNode(true);
        item.parentNode.replaceChild(newItem, item);
        newItem.addEventListener('click', function(e) {
            // اگر هدف دکمه یا داخل دکمه باشد، lightbox باز نشود
            if (e.target.closest('.btn') || e.target.closest('#buyDirectBtn')) {
                return;
            }
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
modal.addEventListener('click', function(e) {
    if (e.target === modal) closeModal();
});
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        if (isLightboxOpen) closeLightbox();
        else if (isModalOpen) closeModal();
    }
});
lightboxClose.addEventListener('click', closeLightbox);
lightbox.addEventListener('click', function(e) {
    if (e.target === lightbox) closeLightbox();
});

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

console.log('✅ MOON SHOP loaded (رفع نهایی عکس بزرگ).');