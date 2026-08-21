// ============================================================
// ACCOUNT DETAIL PAGE
// ============================================================

// دریافت ID از URL
const params = new URLSearchParams(window.location.search);
const accountId = params.get('id');

const detailGallery = document.getElementById('detailGallery');
const detailInfo = document.getElementById('detailInfo');
const detailActions = document.getElementById('detailActions');

// بارگذاری اکانت‌ها
async function loadAccountDetail() {
    try {
        const res = await fetch('data/accounts.json');
        if (!res.ok) throw new Error('Failed to load accounts');
        const accounts = await res.json();
        const account = accounts.find(a => a.id === accountId);
        if (!account) {
            detailInfo.innerHTML = '<p style="color:var(--color-text-muted);">اکانت مورد نظر یافت نشد.</p>';
            return;
        }
        renderDetail(account);
    } catch (err) {
        console.warn('Using fallback data.');
        const accounts = window.allAccounts || [];
        const account = accounts.find(a => a.id === accountId);
        if (!account) {
            detailInfo.innerHTML = '<p style="color:var(--color-text-muted);">اکانت مورد نظر یافت نشد.</p>';
            return;
        }
        renderDetail(account);
    }
}

function renderDetail(account) {
    // گالری
    const images = account.images || [account.image || 'assets/images/accounts/placeholder.webp'];
    let galleryHTML = '';
    if (images.length > 0) {
        galleryHTML += `<div class="gallery-main"><img src="${images[0]}" alt="${account.title}" id="mainImage" /></div>`;
        for (let i = 1; i < images.length; i++) {
            galleryHTML += `<div class="gallery-thumb" data-src="${images[i]}"><img src="${images[i]}" alt="${account.title}" loading="lazy" /></div>`;
        }
    }
    detailGallery.innerHTML = galleryHTML;

    // کلیک روی تام‌نیل‌ها
    document.querySelectorAll('.gallery-thumb').forEach(el => {
        el.addEventListener('click', function() {
            const main = document.getElementById('mainImage');
            if (main) main.src = this.dataset.src;
        });
    });

    // اطلاعات
    const stats = [];
    if (account.mythic) stats.push({ label: 'متیک', value: account.mythic });
    if (account.legendary) stats.push({ label: 'لجند', value: account.legendary });
    if (account.legendarySkins && typeof account.legendarySkins === 'number') stats.push({ label: 'اسکین لجند', value: account.legendarySkins });
    if (account.mythicSkins) stats.push({ label: 'اسکین متیک', value: account.mythicSkins });
    if (account.cp !== undefined && account.cp !== null) {
        const cpVal = account.cp < 0 ? `-${Math.abs(account.cp).toLocaleString()}` : account.cp.toLocaleString();
        stats.push({ label: 'سیپی', value: cpVal, class: account.cp < 0 ? 'cp-negative' : '' });
    }

    const features = [];
    if (account.legendarySkins && typeof account.legendarySkins === 'string') features.push(account.legendarySkins);
    if (account.witchWarden) features.push('ویچ واردن');

    const statsHTML = stats.map(s => `
        <div class="stat-item">
            <span class="stat-label">${s.label}</span>
            <span class="stat-value ${s.class || ''}">${s.value}</span>
        </div>
    `).join('');

    const featuresHTML = features.length > 0 ? `
        <div class="account-features">
            ${features.map(f => `<span class="feature-item">${f}</span>`).join('')}
        </div>
    ` : '';

    const priceHTML = account.price ? `<div class="account-price">${account.price.toLocaleString()} تومان</div>` : '';

    detailInfo.innerHTML = `
        <span class="account-id">${account.id}</span>
        <h1 class="account-title">${account.title}</h1>
        <span class="account-status">موجود</span>
        <div class="stats-grid">${statsHTML}</div>
        ${featuresHTML}
        ${priceHTML}
    `;

    // اقدامات
    const isInCart = window.isInCart && window.isInCart(account.id);
    const cartBtnText = isInCart ? '✅ در سبد خرید' : '➕ افزودن به سبد';
    const cartBtnClass = isInCart ? 'btn-success in-cart' : 'btn-success';

    detailActions.innerHTML = `
        <button class="btn btn-primary" id="buyNowBtn">خرید مستقیم</button>
        <button class="btn ${cartBtnClass}" id="addToCartBtn" ${isInCart ? 'disabled' : ''}>${cartBtnText}</button>
        <a href="cart.html" class="btn btn-outline">مشاهده سبد خرید</a>
    `;

    document.getElementById('buyNowBtn').addEventListener('click', function() {
        if (window.addToCart && !isInCart) window.addToCart(account.id);
        window.location.href = 'checkout.html';
    });

    document.getElementById('addToCartBtn').addEventListener('click', function() {
        if (window.addToCart) {
            const added = window.addToCart(account.id);
            if (added) {
                this.textContent = '✅ در سبد خرید';
                this.classList.add('in-cart');
                this.disabled = true;
                window.updateCartBadge();
                // نمایش پیام کوتاه
                showToast('اکانت به سبد خرید اضافه شد');
            }
        }
    });
}

// Toast ساده
function showToast(message) {
    const existing = document.querySelector('.toast-notification');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
        background: var(--color-bg-secondary); color: var(--color-text-primary);
        padding: 12px 24px; border-radius: 10px; border: 1px solid var(--color-border);
        box-shadow: 0 8px 32px rgba(0,0,0,0.5); z-index: 9999;
        font-family: var(--font-family); font-size: 14px;
        animation: fadeInUp 0.3s ease;
    `;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(-50%) translateY(20px)';
        toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}

// CSS برای Toast
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeInUp {
        from { opacity: 0; transform: translateX(-50%) translateY(20px); }
        to { opacity: 1; transform: translateX(-50%) translateY(0); }
    }
`;
document.head.appendChild(style);

// اجرا
loadAccountDetail();