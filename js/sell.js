// ============================================================
// SELL PAGE — MOON SHOP (فروش اکانت)
// ============================================================

document.addEventListener('DOMContentLoaded', function() {
    // ============================================================
    // کپی کردن آیدی سروش‌پلاس
    // ============================================================
    const copyBtn = document.querySelector('.btn-copy-support');
    const supportIdElement = document.querySelector('.support-value');

    if (copyBtn && supportIdElement) {
        copyBtn.addEventListener('click', function() {
            const text = supportIdElement.textContent.trim();
            copyToClipboard(text, this);
        });
    }

    // ============================================================
    // تابع کپی به کلیپ‌بورد
    // ============================================================
    function copyToClipboard(text, btn) {
        // روش مدرن (clipboard API)
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text)
                .then(() => {
                    showCopyFeedback(btn);
                })
                .catch(() => {
                    fallbackCopy(text, btn);
                });
        } else {
            fallbackCopy(text, btn);
        }
    }

    // ============================================================
    // روش جایگزین کپی (برای مرورگرهای قدیمی)
    // ============================================================
    function fallbackCopy(text, btn) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        textarea.style.left = '-9999px';
        textarea.style.top = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        try {
            const successful = document.execCommand('copy');
            if (successful) {
                showCopyFeedback(btn);
            } else {
                alert('لطفاً آیدی را دستی کپی کنید: ' + text);
            }
        } catch (err) {
            alert('لطفاً آیدی را دستی کپی کنید: ' + text);
        }
        document.body.removeChild(textarea);
    }

    // ============================================================
    // نمایش بازخورد کپی شدن
    // ============================================================
    function showCopyFeedback(btn) {
        const originalText = btn.textContent;
        btn.textContent = '✅ کپی شد';
        btn.classList.add('copied');
        setTimeout(() => {
            btn.textContent = originalText;
            btn.classList.remove('copied');
        }, 2000);
    }

    // ============================================================
    // باز کردن لینک سروش‌پلاس (اختیاری)
    // ============================================================
    const supportLink = document.querySelector('.support-link-clickable');
    if (supportLink) {
        supportLink.addEventListener('click', function(e) {
            e.preventDefault();
            const id = this.dataset.id || '@Sjjshh';
            // باز کردن در سروش‌پلاس (اگر پروتکل مشخص باشد)
            window.open(`https://soroush-plus.com/${id.replace('@', '')}`, '_blank');
        });
    }

    // ============================================================
    // اسکرول به بخش پشتیبانی (اگر از صفحه دیگر آمده باشد)
    // ============================================================
    if (window.location.hash === '#support-section') {
        const supportSection = document.getElementById('support-section');
        if (supportSection) {
            setTimeout(() => {
                supportSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 300);
        }
    }

    console.log('✅ SELL PAGE — MOON SHOP loaded.');
});