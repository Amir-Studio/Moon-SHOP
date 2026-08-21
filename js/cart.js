// ============================================================
// CART LOGIC
// ============================================================
const cartContainer = document.getElementById('cartContainer');
const cartCount = document.getElementById('cartCount');
const cartTotal = document.getElementById('cartTotal');
const checkoutBtn = document.getElementById('checkoutBtn');

function renderCart() {
    const cart = getCart();

    if (!cart || cart.length === 0) {
        cartContainer.innerHTML = `
            <div class="empty-cart">
                <span class="empty-icon">🛒</span>
                <h3>سبد خرید شما خالی است</h3>
                <p>اکانت موردنظرتان را انتخاب کنید و به سبد اضافه کنید.</p>
                <a href="index.html#accounts-target" class="btn btn-primary">مشاهده اکانت‌ها</a>
            </div>
        `;
        cartCount.textContent = '0';
        cartTotal.textContent = '0 تومان';
        checkoutBtn.style.display = 'none';
        return;
    }

    let html = `<div class="cart-items">`;
    let total = 0;

    cart.forEach(item => {
        const price = item.price || 0;
        total += price;
        const img = item.image || 'assets/images/accounts/placeholder.webp';
        html += `
            <div class="cart-item" data-id="${item.id}">
                <div class="cart-item-image"><img src="${img}" alt="${item.title}" /></div>
                <div class="cart-item-info">
                    <span class="cart-item-id">${item.id}</span>
                    <h4 class="cart-item-title">${item.title}</h4>
                    <div class="cart-item-price">${price.toLocaleString()} تومان</div>
                </div>
                <button class="cart-item-remove" data-id="${item.id}">✕</button>
            </div>
        `;
    });

    html += `</div>`;
    cartContainer.innerHTML = html;
    cartCount.textContent = cart.length;
    cartTotal.textContent = `${total.toLocaleString()} تومان`;
    checkoutBtn.style.display = 'block';

    document.querySelectorAll('.cart-item-remove').forEach(btn => {
        btn.addEventListener('click', function() {
            removeFromCart(this.dataset.id);
            renderCart();
            updateCartBadge();
        });
    });
}

if (checkoutBtn) {
    checkoutBtn.addEventListener('click', function() {
        const cart = getCart();
        if (!cart || cart.length === 0) { alert('سبد خرید خالی است.'); return; }
        sessionStorage.setItem('checkoutItems', JSON.stringify(cart));
        const total = cart.reduce((s, i) => s + (i.price || 0), 0);
        sessionStorage.setItem('checkoutTotal', total);
        window.location.href = 'checkout.html';
    });
}

document.addEventListener('DOMContentLoaded', function() { renderCart(); updateCartBadge(); });