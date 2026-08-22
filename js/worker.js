// ============================================================
// MOON SHOP — Local Worker (بدون نیاز به Cloudflare)
// ============================================================

// ===== توکن گیت‌هاب =====
const GITHUB_TOKEN = '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';
const ADMIN_SECRET = 'moon-secret';
const REPO_OWNER = 'Amir-Studio';
const REPO_NAME = 'GONZO-SHOP';
const BRANCH = 'main';

// ============================================================
// توابع اصلی (همون کد Worker ولی برای مرورگر)
// ============================================================

async function getFileContentString(path) {
    const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}?ref=${BRANCH}`;
    const response = await fetch(url, {
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
    const content = data.content;
    return decodeURIComponent(escape(atob(content)));
}

async function updateFileContent(path, content) {
    const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`;
    
    const existing = await fetch(url, {
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
    
    const response = await fetch(url, {
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
// هندلرهای API (برای مرورگر)
// ============================================================
async function handleGetAccounts() {
    try {
        const content = await getFileContentString('data/accounts.json');
        if (!content) {
            return { success: false, error: 'accounts.json not found' };
        }
        const data = JSON.parse(content);
        return { success: true, data };
    } catch (e) {
        return { success: false, error: e.message };
    }
}

async function handleUpdateAccounts(data) {
    try {
        const content = JSON.stringify(data, null, 2);
        await updateFileContent('data/accounts.json', content);
        return { success: true, message: 'Accounts updated successfully' };
    } catch (e) {
        return { success: false, error: e.message };
    }
}

async function handleGetConfig() {
    try {
        const content = await getFileContentString('js/config.js');
        if (!content) {
            return { success: false, error: 'config.js not found' };
        }
        const configMatch = content.match(/const CONFIG = ({[\s\S]*?});/);
        if (!configMatch) {
            return { success: false, error: 'CONFIG not found' };
        }
        const config = new Function('return ' + configMatch[1])();
        return { success: true, data: config };
    } catch (e) {
        return { success: false, error: e.message };
    }
}

async function handleUpdateConfig(config) {
    try {
        const content = `// ============================================================
// CONFIG — تنظیمات قابل تغییر توسط صاحب سایت
// ============================================================
const CONFIG = ${JSON.stringify(config, null, 2)};
`;
        await updateFileContent('js/config.js', content);
        return { success: true, message: 'Config updated successfully' };
    } catch (e) {
        return { success: false, error: e.message };
    }
}

async function handleUploadImage(imageData, fileName) {
    try {
        const sizeInBytes = Math.ceil((imageData.length * 3) / 4);
        if (sizeInBytes > 100 * 1024 * 1024) {
            throw new Error('Image size exceeds 100 MB limit.');
        }
        
        const timestamp = Date.now();
        const ext = fileName.includes('.') ? fileName.split('.').pop() : 'jpg';
        const cleanFileName = fileName.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9\-_]/g, '_');
        const newFileName = `${cleanFileName}_${timestamp}.${ext}`;
        const path = `assets/images/accounts/${newFileName}`;
        
        const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`;
        const body = {
            message: `Upload image: ${newFileName}`,
            content: imageData,
            branch: BRANCH
        };
        
        const response = await fetch(url, {
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

// ============================================================
// تابع اصلی که از main.js صدا زده میشه
// ============================================================
window.LocalWorker = {
    async request(method, path, body = null) {
        try {
            if (path === '/api/admin/login') {
                const { code } = body;
                if (code === ADMIN_SECRET) {
                    return { success: true, token: 'local-token-' + Date.now() };
                }
                return { success: false, error: 'Invalid admin code' };
            }
            
            if (path === '/api/upload' && method === 'POST') {
                const { image, fileName } = body;
                return await handleUploadImage(image, fileName);
            }
            
            if (path === '/api/accounts' && method === 'GET') {
                return await handleGetAccounts();
            }
            
            if (path === '/api/accounts' && method === 'PUT') {
                return await handleUpdateAccounts(body.data);
            }
            
            if (path === '/api/config' && method === 'GET') {
                return await handleGetConfig();
            }
            
            if (path === '/api/config' && method === 'PUT') {
                return await handleUpdateConfig(body.data);
            }
            
            return { success: false, error: `Endpoint ${path} not found` };
        } catch (e) {
            return { success: false, error: e.message };
        }
    }
};

console.log('✅ Local Worker loaded. No Cloudflare needed!');