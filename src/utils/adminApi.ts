export function authHeaders() {
    const t = localStorage.getItem('adm_token') || ''
    return { Authorization: 'Bearer ' + t }
  }

// ตัวอย่างใช้งาน:
// fetch('/api/bookings/month?yyyymm=2025-11', { headers: authHeaders() })