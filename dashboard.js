// ============================================================
// DASHBOARD PAGE
// ============================================================

// ===== تنظیمات (قابل تغییر توسط صاحب سایت) =====
const SUPPORT_PHONE = '۰۹XX XXX XXXX'; // ← شماره تماس پشتیبانی را جایگزین کنید
// =======================================================

document.getElementById('dashboardSupportPhone').textContent = SUPPORT_PHONE;

document.getElementById('dashboardSupportBtn').addEventListener('click', function(e) {
    e.preventDefault();
    const phone = SUPPORT_PHONE.replace(/\s/g, '');
    window.location.href = `tel:${phone}`;
});