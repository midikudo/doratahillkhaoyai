export async function apiFetch(path, opts = {}) {
    const token = localStorage.getItem('admin_token')
    const headers = new Headers(opts.headers || {})
    if (token) headers.set('Authorization', 'Bearer ' + token)
    return fetch(path, { ...opts, headers })
  }
  