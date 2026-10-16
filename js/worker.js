// MOON SHOP — browser-safe read-only adapter.
// IMPORTANT: never place a GitHub token or admin secret in a public JavaScript file.
// Persistent writes and admin authentication must be implemented in a protected server-side Worker.
(() => {
  const OWNER = 'Amir-Studio';
  const REPO = 'Moon-SHOP';
  const BRANCH = 'main';

  async function readPublicFile(path) {
    const safePath = path.split('/').map(encodeURIComponent).join('/');
    const response = await fetch(`https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}/${safePath}`);
    if (!response.ok) throw new Error(`Public file unavailable (${response.status})`);
    return response.text();
  }

  window.LocalWorker = {
    async request(method, path) {
      try {
        if (method === 'GET' && path === '/api/accounts') {
          const data = JSON.parse(await readPublicFile('data/accounts.json'));
          return { success: true, data };
        }
        if (method === 'GET' && path === '/api/config') {
          const source = await readPublicFile('js/config.js');
          const match = source.match(/const CONFIG = (\{[\s\S]*?\});/);
          if (!match) throw new Error('Public config format is invalid.');
          const data = JSON.parse(match[1].replace(/,\s*([}\]])/g, '$1'));
          return { success: true, data };
        }
        return {
          success: false,
          error: 'احراز هویت و ذخیره‌سازی مدیریت باید از طریق بک‌اند امن انجام شود؛ این آداپتور فقط خواندنی است.'
        };
      } catch (error) {
        return { success: false, error: error.message || 'Request failed.' };
      }
    }
  };
})();