// src/lib/http.ts
export const API = import.meta.env.VITE_API_BASE || ''

export function authHeaders() {
  const t = localStorage.getItem('token')
  return t ? { Authorization: 'Bearer ' + t } : {}
}

export async function postAuth(url: string, body: any, isJSON = true) {
  const h: any = authHeaders()
  let opt: any = { method:'POST', headers: h }
  if (isJSON) {
    opt.headers['Content-Type'] = 'application/json'
    opt.body = JSON.stringify(body)
  } else {
    opt.body = body
  }
  const r = await fetch(API + url, opt)
  if (r.status === 401) {
    localStorage.removeItem('token'); localStorage.removeItem('admin')
    window.location.href = '/admin/login'
    throw new Error('unauthorized')
  }
  return r.json()
}
