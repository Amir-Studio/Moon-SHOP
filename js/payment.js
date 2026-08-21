// ============================================================
// PAYMENT LOGIC — MOON SHOP
// ============================================================
const orderSummary = document.getElementById('paymentOrderSummary');
const totalAmount = document.getElementById('totalAmount');
const cardDisplay = document.getElementById('cardNumberDisplay');
const adminDisplay = document.getElementById('adminIdDisplay');
const copyCardBtn = document.getElementById('copyCardBtn');
const copyAdminBtn = document.getElementById('copyAdminBtn');

function renderOrderSummary() {
    const items = JSON.parse(sessionStorage.getItem('checkoutItems') || '[]');
    const total = sessionStorage.getItem('checkoutTotal') || '0';

    if (!items || items.length === 0) {
        orderSummary.innerHTML = `
            <div class="empty-order">
                <p>هیچ سفارشی برای پرداخت وجود ندارد.</p>
                <a href="index.html#accounts-target" class="btn btn-outline">مشاهده اکانت‌ها</a>
            </div>
        `;
        return;
    }

    let html = `<h3>سفارش شما</h3><div class="order-items">`;
    items.forEach(item => {
        const price = item.price || 0;
        const img = item.image || (item.images && item.images[0]) || 'assets/images/accounts/placeholder.webp';
        html += `
            <div class="order-item">
                <img src="${img}" alt="${item.title}" />
                <div class="order-item-info">
                    <div class="order-item-id">${item.id}</div>
                    <div class="order-item-title">${item.title}</div>
                    <div class="order-item-price">${price.toLocaleString()} تومان</div>
                </div>
            </div>
        `;
    });
    html += `</div>`;
    html += `
        <div class="order-total">
            <span>مبلغ نهایی:</span>
            <span class="total-amount">${Number(total).toLocaleString()} تومان</span>
        </div>
    `;
    orderSummary.innerHTML = html;
}

function renderPaymentInfo() {
    const total = sessionStorage.getItem('checkoutTotal') || '0';
    totalAmount.textContent = `${Number(total).toLocaleString()} تومان`;
    cardDisplay.textContent = CONFIG.cardNumber || '6219861956267685';
    adminDisplay.textContent = CONFIG.adminSoroushId || '@Sjjshh';
}

function copyToClipboard(text, btn) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            showCopyFeedback(btn);
        }).catch(() => fallbackCopy(text, btn));
    } else {
        fallbackCopy(text, btn);
    }
}

function fallbackCopy(text, btn) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
        document.execCommand('copy');
        showCopyFeedback(btn);
    } catch (err) {
        alert('لطفاً متن را دستی کپی کنید: ' + text);
    }
    document.body.removeChild(textarea);
}

function showCopyFeedback(btn) {
    const originalText = btn.textContent;
    btn.textContent = '✓ کپی شد';
    btn.classList.add('copied');
    setTimeout(() => {
        btn.textContent = originalText;
        btn.classList.remove('copied');
    }, 2000);
}

copyCardBtn.addEventListener('click', function() {
    copyToClipboard(CONFIG.cardNumber || '6219861956267685', this);
});

copyAdminBtn.addEventListener('click', function() {
    copyToClipboard(CONFIG.adminSoroushId || '@Sjjshh', this);
});

document.addEventListener('DOMContentLoaded', function() {
    renderOrderSummary();
    renderPaymentInfo();
});