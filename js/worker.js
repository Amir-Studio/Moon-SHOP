// ============================================================
// GONZO SHOP — Cloudflare Worker (با JWT و آپلود عکس)
// ============================================================

// ============================================================
// تنظیمات پایه
// ============================================================
const REPO_OWNER = 'Amir-Studio';
const REPO_NAME = 'GONZO-SHOP';
const BRANCH = 'main';
const JWT_ALG = 'HS256';
const TOKEN_EXPIRY_SECONDS = 3600; // 1 ساعت
const MAX_IMAGE_SIZE = 100 * 1024 * 1024; // ۱۰۰ مگابایت

// ============================================================
// توابع کمکی برای JWT (با Web Crypto API)
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
    } catch (e) {
        return null;
    }
}

// ============================================================
// توابع کمکی برای GitHub API (با UTF-8 استاندارد)
// ============================================================

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

// ============================================================
// تابع آپلود فایل (تصویر)
// ============================================================

async function uploadImage(base64Data, fileName, token) {
    // بررسی حجم
    const sizeInBytes = Math.ceil((base64Data.length * 3) / 4);
    if (sizeInBytes > MAX_IMAGE_SIZE) {
        throw new Error(`Image size exceeds ${MAX_IMAGE_SIZE / (1024 * 1024)} MB limit. Please compress your image using tools like TinyPNG, Squoosh, or Photoshop.`);
    }

    // ایجاد مسیر با timestamp برای جلوگیری از تداخل
    const timestamp = Date.now();
    const ext = fileName.includes('.') ? fileName.split('.').pop() : 'jpg';
    const cleanFileName = fileName.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9\-_]/g, '_');
    const newFileName = `${cleanFileName}_${timestamp}.${ext}`;
    const path = `assets/images/accounts/${newFileName}`;

    // آپلود فایل
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

// ============================================================
// CORS Headers
// ============================================================

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

async function handleAdminLogin(body, env) {
    try {
        const { code } = body;
        const adminSecret = env.ADMIN_SECRET;
        if (!adminSecret) {
            return errorResponse('ADMIN_SECRET not configured', 500);
        }
        if (code !== adminSecret) {
            return errorResponse('Invalid admin code', 401);
        }
        const jwtSecret = env.JWT_SECRET || adminSecret;
        const token = await generateJWT({ sub: 'admin' }, jwtSecret);
        return successResponse({ token }, 'Login successful');
    } catch (e) {
        return errorResponse(e.message);
    }
}

async function handleUploadImage(body, token, authHeader, env) {
    try {
        if (!authHeader) {
            return errorResponse('Missing Authorization header', 401);
        }
        const parts = authHeader.split(' ');
        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            return errorResponse('Invalid Authorization header format', 401);
        }
        const jwtToken = parts[1];
        const jwtSecret = env.JWT_SECRET || env.ADMIN_SECRET;
        if (!jwtSecret) {
            return errorResponse('JWT_SECRET not configured', 500);
        }
        const payload = await verifyJWT(jwtToken, jwtSecret);
        if (!payload) {
            return errorResponse('Invalid or expired token', 401);
        }
        if (payload.sub !== 'admin') {
            return errorResponse('Invalid token subject', 401);
        }

        const { image, fileName } = body;
        if (!image || !fileName) {
            return errorResponse('Missing image or fileName', 400);
        }

        const path = await uploadImage(image, fileName, token);
        return successResponse({ path }, 'Image uploaded successfully');
    } catch (e) {
        return errorResponse(e.message);
    }
}

async function handleGetAccounts(token) {
    try {
        const content = await getFileContentString('data/accounts.json', token);
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

async function handleUpdateAccounts(body, token, authHeader, env) {
    try {
        if (!authHeader) {
            return errorResponse('Missing Authorization header', 401);
        }
        const parts = authHeader.split(' ');
        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            return errorResponse('Invalid Authorization header format', 401);
        }
        const jwtToken = parts[1];
        const jwtSecret = env.JWT_SECRET || env.ADMIN_SECRET;
        if (!jwtSecret) {
            return errorResponse('JWT_SECRET not configured', 500);
        }
        const payload = await verifyJWT(jwtToken, jwtSecret);
        if (!payload) {
            return errorResponse('Invalid or expired token', 401);
        }
        if (payload.sub !== 'admin') {
            return errorResponse('Invalid token subject', 401);
        }

        if (!body.data) {
            return errorResponse('Missing data field', 400);
        }
        const content = JSON.stringify(body.data, null, 2);
        await updateFileContent('data/accounts.json', content, token, 'Update accounts data via admin panel');
        return successResponse(null, 'Accounts updated successfully');
    } catch (e) {
        return errorResponse(e.message);
    }
}

async function handleGetConfig(token) {
    try {
        const content = await getFileContentString('js/config.js', token);
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

async function handleUpdateConfig(body, token, authHeader, env) {
    try {
        if (!authHeader) {
            return errorResponse('Missing Authorization header', 401);
        }
        const parts = authHeader.split(' ');
        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            return errorResponse('Invalid Authorization header format', 401);
        }
        const jwtToken = parts[1];
        const jwtSecret = env.JWT_SECRET || env.ADMIN_SECRET;
        if (!jwtSecret) {
            return errorResponse('JWT_SECRET not configured', 500);
        }
        const payload = await verifyJWT(jwtToken, jwtSecret);
        if (!payload) {
            return errorResponse('Invalid or expired token', 401);
        }
        if (payload.sub !== 'admin') {
            return errorResponse('Invalid token subject', 401);
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
        await updateFileContent('js/config.js', content, token, 'Update config via admin panel');
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
        const token = env.GITHUB_TOKEN;
        if (!token) {
            return errorResponse('GITHUB_TOKEN secret is not set in Cloudflare Worker', 500);
        }

        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders() });
        }

        const url = new URL(request.url);
        const path = url.pathname;

        try {
            if (path === '/api/admin/login' && request.method === 'POST') {
                const body = await request.json();
                return await handleAdminLogin(body, env);
            }

            if (path === '/api/upload' && request.method === 'POST') {
                const body = await request.json();
                const authHeader = request.headers.get('Authorization');
                return await handleUploadImage(body, token, authHeader, env);
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
                return await handleGetAccounts(token);
            }

            if (path === '/api/accounts' && request.method === 'PUT') {
                const body = await request.json();
                const authHeader = request.headers.get('Authorization');
                return await handleUpdateAccounts(body, token, authHeader, env);
            }

            if (path === '/api/config' && request.method === 'GET') {
                return await handleGetConfig(token);
            }

            if (path === '/api/config' && request.method === 'PUT') {
                const body = await request.json();
                const authHeader = request.headers.get('Authorization');
                return await handleUpdateConfig(body, token, authHeader, env);
            }

            return errorResponse(`Endpoint ${path} not found`, 404);

        } catch (error) {
            console.error('Worker error:', error);
            return errorResponse(error.message || 'Internal server error');
        }
    }
};