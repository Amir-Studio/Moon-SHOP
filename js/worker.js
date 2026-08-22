// ============================================================
// MOON SHOP — Cloudflare Worker (با پشتیبانی از چند کارت و آیدی)
// ============================================================

// ===== توکن گیت‌هاب (مستقیماً در کد) =====
// ============================================================
// MOON SHOP — Cloudflare Worker
// ============================================================

const GITHUB_TOKEN = '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';
const ADMIN_SECRET = 'moon-secret';
const REPO_OWNER = 'Amir-Studio';
const REPO_NAME = 'GONZO-SHOP';
const BRANCH = 'main';
const JWT_ALG = 'HS256';
const TOKEN_EXPIRY_SECONDS = 3600;
const MAX_IMAGE_SIZE = 100 * 1024 * 1024;

// ... (بقیه کدهای کمکی و هندلرها دقیقاً مثل نسخه قبلی)
// برای جلوگیری از طولانی شدن، کد کامل worker.js رو در بخش قبلی قرار دادم
// از همان کد استفاده کنید.
// ============================================================
// توابع کمکی (بدون تغییر)
// ============================================================
function base64UrlEncode(str) {
    return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function base64UrlDecode(str) {
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    while (str.length % 4) str += '=';
    return str;
}
async function hmacSha256(key, message) {
    const encoder = new TextEncoder();
    const keyData = await crypto.subtle.importKey(
        'raw',
        encoder.encode(key),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );
    const signature = await crypto.subtle.sign(
        'HMAC',
        keyData,
        encoder.encode(message)
    );
    return btoa(String.fromCharCode(...new Uint8Array(signature)));
}
async function generateJWT(payload, secret) {
    const header = { alg: JWT_ALG, typ: 'JWT' };
    const now = Math.floor(Date.now() / 1000);
    const exp = now + TOKEN_EXPIRY_SECONDS;
    const fullPayload = { ...payload, exp, iat: now };
    const headerB64 = base64UrlEncode(btoa(JSON.stringify(header)));
    const payloadB64 = base64UrlEncode(btoa(JSON.stringify(fullPayload)));
    const signature = await hmacSha256(secret, `${headerB64}.${payloadB64}`);
    const signatureB64 = base64UrlEncode(signature);
    return `${headerB64}.${payloadB64}.${signatureB64}`;
}
async function verifyJWT(token, secret) {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        const [headerB64, payloadB64, signatureB64] = parts;
        const expectedSignature = await hmacSha256(secret, `${headerB64}.${payloadB64}`);
        const expectedSignatureB64 = base64UrlEncode(expectedSignature);
        if (signatureB64 !== expectedSignatureB64) return null;
        const payloadJson = atob(base64UrlDecode(payloadB64));
        const payload = JSON.parse(payloadJson);
        const now = Math.floor(Date.now() / 1000);
        if (payload.exp && payload.exp < now) return null;
        return payload;
    } catch (e) { return null; }
}
function utf8ToBase64(str) {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    let binary = '';
    data.forEach(byte => binary += String.fromCharCode(byte));
    return btoa(binary);
}
function base64ToUtf8(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
}
async function getFileContent(path, token) {
    const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}?ref=${BRANCH}`;
    const response = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github.v3+json'
        }
    });
    if (response.status === 404) return null;
    if (!response.ok) {
        const error = await response.text();
        throw new Error(`GitHub API error (${response.status}): ${error}`);
    }
    return await response.json();
}
async function updateFileContent(path, content, token, commitMessage) {
    const existing = await getFileContent(path, token);
    const sha = existing ? existing.sha : null;
    const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`;
    const body = {
        message: commitMessage || `Update ${path}`,
        content: utf8ToBase64(content),
        branch: BRANCH
    };
    if (sha) body.sha = sha;
    const response = await fetch(url, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
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
async function getFileContentString(path, token) {
    const data = await getFileContent(path, token);
    if (!data) return null;
    return base64ToUtf8(data.content);
}
async function uploadImage(base64Data, fileName, token) {
    const sizeInBytes = Math.ceil((base64Data.length * 3) / 4);
    if (sizeInBytes > MAX_IMAGE_SIZE) {
        throw new Error(`Image size exceeds ${MAX_IMAGE_SIZE / (1024 * 1024)} MB limit.`);
    }
    const timestamp = Date.now();
    const ext = fileName.includes('.') ? fileName.split('.').pop() : 'jpg';
    const cleanFileName = fileName.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9\-_]/g, '_');
    const newFileName = `${cleanFileName}_${timestamp}.${ext}`;
    const path = `assets/images/accounts/${newFileName}`;
    const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`;
    const body = {
        message: `Upload image: ${newFileName}`,
        content: base64Data,
        branch: BRANCH
    };
    const response = await fetch(url, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });
    if (!response.ok) {
        const error = await response.text();
        throw new Error(`GitHub API error (${response.status}): ${error}`);
    }
    return `assets/images/accounts/${newFileName}`;
}
function corsHeaders() {
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Content-Type': 'application/json'
    };
}
function errorResponse(message, status = 500) {
    return new Response(JSON.stringify({ success: false, error: message }), {
        status: status,
        headers: corsHeaders()
    });
}
function successResponse(data, message = 'Success') {
    return new Response(JSON.stringify({ success: true, data, message }), {
        status: 200,
        headers: corsHeaders()
    });
}

// ============================================================
// هندلرهای API
// ============================================================
async function handleAdminLogin(body) {
    try {
        const { code } = body;
        if (code !== ADMIN_SECRET) {
            return errorResponse('Invalid admin code', 401);
        }
        const token = await generateJWT({ sub: 'admin' }, ADMIN_SECRET);
        return successResponse({ token }, 'Login successful');
    } catch (e) {
        return errorResponse(e.message);
    }
}
async function handleUploadImage(body, authHeader) {
    try {
        if (!authHeader || authHeader !== `Bearer ${ADMIN_SECRET}`) {
            return errorResponse('Unauthorized', 401);
        }
        const { image, fileName } = body;
        if (!image || !fileName) {
            return errorResponse('Missing image or fileName', 400);
        }
        const path = await uploadImage(image, fileName, GITHUB_TOKEN);
        return successResponse({ path }, 'Image uploaded successfully');
    } catch (e) {
        return errorResponse(e.message);
    }
}
async function handleGetAccounts() {
    try {
        const content = await getFileContentString('data/accounts.json', GITHUB_TOKEN);
        if (!content) {
            return errorResponse('accounts.json not found', 404);
        }
        const data = JSON.parse(content);
        return successResponse(data);
    } catch (e) {
        if (e.message.includes('404')) {
            return errorResponse('accounts.json not found', 404);
        }
        return errorResponse(e.message);
    }
}
async function handleUpdateAccounts(body, authHeader) {
    try {
        if (!authHeader || authHeader !== `Bearer ${ADMIN_SECRET}`) {
            return errorResponse('Unauthorized', 401);
        }
        if (!body.data) {
            return errorResponse('Missing data field', 400);
        }
        const content = JSON.stringify(body.data, null, 2);
        await updateFileContent('data/accounts.json', content, GITHUB_TOKEN, 'Update accounts data via admin panel');
        return successResponse(null, 'Accounts updated successfully');
    } catch (e) {
        return errorResponse(e.message);
    }
}
async function handleGetConfig() {
    try {
        const content = await getFileContentString('js/config.js', GITHUB_TOKEN);
        if (!content) {
            return errorResponse('config.js not found', 404);
        }
        const configMatch = content.match(/const CONFIG = ({[\s\S]*?});/);
        if (!configMatch) {
            return errorResponse('CONFIG not found in config.js', 500);
        }
        const config = new Function('return ' + configMatch[1])();
        return successResponse(config);
    } catch (e) {
        return errorResponse(e.message);
    }
}
async function handleUpdateConfig(body, authHeader) {
    try {
        if (!authHeader || authHeader !== `Bearer ${ADMIN_SECRET}`) {
            return errorResponse('Unauthorized', 401);
        }
        if (!body.data) {
            return errorResponse('Missing data field', 400);
        }
        const config = body.data;
        const content = `// ============================================================
// CONFIG — تنظیمات قابل تغییر توسط صاحب سایت
// ============================================================
const CONFIG = ${JSON.stringify(config, null, 2)};
`;
        await updateFileContent('js/config.js', content, GITHUB_TOKEN, 'Update config via admin panel');
        return successResponse(null, 'Config updated successfully');
    } catch (e) {
        return errorResponse(e.message);
    }
}

// ============================================================
// Main Handler
// ============================================================
export default {
    async fetch(request, env) {
        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders() });
        }
        const url = new URL(request.url);
        const path = url.pathname;

        try {
            if (path === '/api/admin/login' && request.method === 'POST') {
                const body = await request.json();
                return await handleAdminLogin(body);
            }
            if (path === '/api/upload' && request.method === 'POST') {
                const body = await request.json();
                const authHeader = request.headers.get('Authorization');
                return await handleUploadImage(body, authHeader);
            }
            if (path === '/api/health' && request.method === 'GET') {
                return successResponse({
                    status: 'ok',
                    timestamp: new Date().toISOString(),
                    repository: `${REPO_OWNER}/${REPO_NAME}`,
                    branch: BRANCH
                });
            }
            if (path === '/api/accounts' && request.method === 'GET') {
                return await handleGetAccounts();
            }
            if (path === '/api/accounts' && request.method === 'PUT') {
                const body = await request.json();
                const authHeader = request.headers.get('Authorization');
                return await handleUpdateAccounts(body, authHeader);
            }
            if (path === '/api/config' && request.method === 'GET') {
                return await handleGetConfig();
            }
            if (path === '/api/config' && request.method === 'PUT') {
                const body = await request.json();
                const authHeader = request.headers.get('Authorization');
                return await handleUpdateConfig(body, authHeader);
            }
            return errorResponse(`Endpoint ${path} not found`, 404);
        } catch (error) {
            console.error('Worker error:', error);
            return errorResponse(error.message || 'Internal server error');
        }
    }
};