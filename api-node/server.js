// server.js
require('dotenv').config()
const path = require('path')
const fs = require('fs')
const fsp = fs.promises
const express = require('express')
const cors = require('cors')
const morgan = require('morgan')
const fetch = require('node-fetch')
const multer = require('multer')
const mysql = require('mysql2/promise')
const sharp = require('sharp') // <<-- ใช้ย่อ/บีบอัดรูป

/* ====== Config ====== */
const PORT = process.env.PORT || 3001
const CORS_ORIGINS = (process.env.CORS_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean)
const dayjs = require('dayjs')

const isSameOrBefore = require('dayjs/plugin/isSameOrBefore')
const isSameOrAfter = require('dayjs/plugin/isSameOrAfter')
const isBetween = require('dayjs/plugin/isBetween')

dayjs.extend(isSameOrBefore)
dayjs.extend(isSameOrAfter)
dayjs.extend(isBetween)

const DB = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  database: process.env.DB_NAME || 'doratahillkhaoyai',
  password: process.env.DB_PASS || '',
  waitForConnections: true,
  connectionLimit: 10,
  namedPlaceholders: true,
  charset: 'utf8mb4_general_ci', // หรือ 'utf8mb4_unicode_ci'
}

const UPLOAD_ROOT = path.resolve(process.env.UPLOAD_ROOT || './uploads')
const PUBLIC_BASE = process.env.PUBLIC_BASE || '/api/uploads'

/* ====== Init ====== */
const app = express()
const pool = mysql.createPool(DB)
pool.query("SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci");
pool.query("SET CHARACTER SET utf8mb4");
app.use(morgan('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// CORS
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true)
    if (CORS_ORIGINS.length === 0) return cb(null, true)
    if (CORS_ORIGINS.includes(origin)) return cb(null, true)
    cb(new Error('CORS blocked: ' + origin))
  },
  credentials: true,
}))

// Static uploads
app.use('/api/uploads', express.static(UPLOAD_ROOT, { fallthrough: true }))

// Ensure base folders exist
const ensureDir = (p) => { if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true }) }
ensureDir(UPLOAD_ROOT)
;['rooms','facilities','attractions','reviews','news'].forEach(p => ensureDir(path.join(UPLOAD_ROOT, p)))

/* ===== Upload / Files utils ===== */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024, files: 30 },
  fileFilter: (req, file, cb) => {
    const ok = ['image/jpeg','image/png','image/webp','image/jpg','image/pjpeg'].includes(file.mimetype)
    cb(null, ok)
  }
})

const safeBase = (name0) =>
  (path.basename(name0, path.extname(name0)) || 'img').replace(/[^a-zA-Z0-9-_]/g, '') || 'img'

/**
 * บีบอัด/ย่อภาพให้ ≤ 90KB
 * กลยุทธ์: หมุนออโต้ → ย่อความกว้าง (1600→1200→1000→800→640) → เข้ารหัส WebP คุณภาพ (80→70→60→50→40→35→30)
 * คืน { buffer, ext: '.webp' }
 */
async function compressTo90KB(inputBuffer) {
  const target = 90 * 1024
  const widths = [1600, 1200, 1000, 800, 640]
  const qualities = [80, 70, 60, 50, 40, 35, 30]

  for (const w of widths) {
    for (const q of qualities) {
      const out = await sharp(inputBuffer).rotate().resize({ width: w, withoutEnlargement: true }).webp({ quality: q }).toBuffer()
      if (out.length <= target) return { buffer: out, ext: '.webp' }
    }
  }
  // ถ้าเล็กกว่า 90KB ไม่ได้จริง ๆ (รูปใหญ่มาก) ก็คืนค่าเวอร์ชันสุดท้าย
  const fallback = await sharp(inputBuffer).rotate().resize({ width: 640, withoutEnlargement: true }).webp({ quality: 28 }).toBuffer()
  return { buffer: fallback, ext: '.webp' }
}

function makeFilename(originalname, extOverride = '.webp') {
  const base = safeBase(originalname)
  const ext = (extOverride || '.webp').startsWith('.') ? extOverride : ('.' + extOverride)
  return `${base}-${Date.now()}-${Math.random().toString(36).slice(2,8)}${ext}`
}

async function saveOneOptimized(file, destDir) {
  ensureDir(destDir)
  const { buffer, ext } = await compressTo90KB(file.buffer)
  const filename = makeFilename(file.originalname || 'img', ext)
  const full = path.join(destDir, filename)
  await fsp.writeFile(full, buffer)
  return filename
}

async function saveManyOptimized(files, destDir) {
  ensureDir(destDir)
  const saved = []
  for (let i = 0; i < files.length; i++) {
    const filename = await saveOneOptimized(files[i], destDir)
    saved.push({ filename, sort_order: i })
  }
  return saved
}

// ============ AUTH ============
// ต้องติดตั้งก่อน: npm i jsonwebtoken bcryptjs
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')

const JWT_SECRET  = process.env.JWT_SECRET  || 'dev_secret'
const JWT_EXPIRES = process.env.JWT_EXPIRES || '7d'

// ลงชื่อเข้าใช้: POST /api/auth/login
// body: { email, password }
app.post('/api/auth/login', async (req, res) => {
  const { email = '', password = '' } = req.body || {}
  if (!email || !password) return res.status(400).json({ ok:false, error:'missing_fields' })
  const conn = await pool.getConnection()
  try {
    const [rows] = await conn.execute(
      'SELECT id, name, email, password_hash, role, is_active FROM admins WHERE email=? AND is_active=1 LIMIT 1',
      [email.trim()]
    )
    if (!rows.length) return res.status(401).json({ ok:false, error:'bad_credentials' })
    const adm = rows[0]
    const ok = await bcrypt.compare(password, adm.password_hash || '')
    if (!ok) return res.status(401).json({ ok:false, error:'bad_credentials' })

    const token = jwt.sign(
      { sub: adm.id, role: adm.role, name: adm.name, email: adm.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    )
    res.json({ ok:true, token, admin: { id:adm.id, name:adm.name, email:adm.email, role:adm.role } })
  } catch (e) {
    console.error(e); res.status(500).json({ ok:false, error:'server_error' })
  } finally { conn.release() }
})

// middleware ตรวจ Bearer token
function auth(req, res, next) {
  const h = req.headers.authorization || ''
  const m = h.match(/^Bearer\s+(.+)$/i)
  if (!m) return res.status(401).json({ ok:false, error:'unauthorized' })
  try {
    req.user = jwt.verify(m[1], JWT_SECRET) // {sub, role, name, email}
    return next()
  } catch {
    return res.status(401).json({ ok:false, error:'invalid_token' })
  }
}

// ใช้เช็ค token ว่ายังโอเคอยู่ไหม
app.get('/api/auth/me', auth, (req, res) => {
  res.json({ ok:true, me: req.user })
})


/* =========================================================
   NEWS
   ========================================================= */

// POST /api/news/create.php
app.post('/api/news/create.php', upload.single('cover'), async (req, res) => {
  const conn = await pool.getConnection()
  try {
    // === รองรับหลายภาษา ===
    const title = (req.body.title_th || '').trim()
    const title_th = (req.body.title_th || '').trim()
    const title_en = (req.body.title_en || '').trim() || null
    const body_th  = (req.body.body_th  || '').trim() || null
    const body_en  = (req.body.body_en  || '').trim() || null

    // บังคับให้ต้องมีหัวข้อภาษาไทย
    if (!title_th) {
      return res.status(400).json({ ok:false, error:'title_th_required' })
    }

    const link       = (req.body.link || '').trim() || null
    const publish_at = (req.body.publish_at || '').trim() || null
    const is_active  = String(req.body.is_active ?? '1') === '1' ? 1 : 0

    await conn.beginTransaction()

    // INSERT แบบหลายภาษา
    const [r] = await conn.execute(
      `INSERT INTO news
        (title_th, title_en, body_th, body_en, link, publish_at, is_active)
       VALUES (?,?,?,?,?,?,?)`,
      [title_th, title_en, body_th, body_en, link, publish_at || null, is_active]
    )

    const id = r.insertId

    // รูปปก (บีบอัด)
    let cover_path = null
    if (req.file) {
      const destDir = path.join(UPLOAD_ROOT, 'news', String(id))
      const filename = await saveOneOptimized(req.file, destDir)
      cover_path = `${PUBLIC_BASE}/news/${id}/${filename}`
      await conn.execute('UPDATE news SET cover_path=? WHERE id=?', [cover_path, id])
    }

    await conn.commit()
    res.json({ ok:true, id, cover_path })
  } catch (e) {
    await conn.rollback()
    console.error(e)
    res.status(500).json({ ok:false, error:'server_error', detail:String(e.message || e) })
  } finally {
    conn.release()
  }
})

// GET /api/news/detail.php
app.get('/api/news/detail.php', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const id = Number(req.query.id);
    if (!id) {
      return res.status(400).json({ ok: false, error: 'missing_id' });
    }

    const [rows] = await conn.execute(
      `SELECT id,
              title_th,
              title_en,
              body_th,
              body_en,
              link,
              publish_at,
              is_active,
              cover_path
       FROM news
       WHERE id = ?
       LIMIT 1`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ ok: false, error: 'not_found' });
    }

    const row = rows[0];

    // ส่ง field ให้ตรงกับที่ Vue ใช้: item.title_th, item.body_th, item.cover_url
    res.json({
      ok: true,
      item: {
        id: row.id,
        title_th: row.title_th,
        title_en: row.title_en,
        body_th: row.body_th,
        body_en: row.body_en,
        link: row.link,
        publish_at: row.publish_at,
        is_active: row.is_active,
        cover_url: row.cover_path || null,
      },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      ok: false,
      error: 'server_error',
      detail: String(e.message || e),
    });
  } finally {
    conn.release();
  }
});


// POST /api/news/update.php
app.post('/api/news/update.php', upload.single('cover'), async (req, res) => {
  const conn = await pool.getConnection()
  try {
    const id = Number(req.body.id)
    if (!id) return res.status(400).json({ ok:false, error:'missing_id' })

    // === รองรับหลายภาษา ===
    const title_th = (req.body.title_th || '').trim()
    const title_en = (req.body.title_en || '').trim() || null
    const body_th  = (req.body.body_th  || '').trim() || null
    const body_en  = (req.body.body_en  || '').trim() || null

    const link       = (req.body.link || '').trim() || null
    const publish_at = (req.body.publish_at || '').trim() || null
    const is_active  = String(req.body.is_active ?? '1') === '1' ? 1 : 0

    await conn.beginTransaction()

    if (title_th) {
      // กรณีส่ง title_th มา ⇒ อัปเดตทุกฟิลด์หลัก
      await conn.execute(
        `UPDATE news
         SET title_th=?, title_en=?, body_th=?, body_en=?,
             link=?, publish_at=?, is_active=?
         WHERE id=?`,
        [title_th, title_en, body_th, body_en, link, publish_at || null, is_active, id]
      )
    } else {
      // ถ้า title_th ว่าง (เช่น อยากอัปเดตเฉพาะ body/link)
      await conn.execute(
        `UPDATE news
         SET body_th=?, body_en=?, link=?, publish_at=?, is_active=?
         WHERE id=?`,
        [body_th, body_en, link, publish_at || null, is_active, id]
      )
    }

    // จัดการรูปปก
    if (req.file) {
      const destDir = path.join(UPLOAD_ROOT, 'news', String(id))
      const filename = await saveOneOptimized(req.file, destDir)
      const cover_path = `${PUBLIC_BASE}/news/${id}/${filename}`
      await conn.execute('UPDATE news SET cover_path=? WHERE id=?', [cover_path, id])
    }

    await conn.commit()
    res.json({ ok:true })
  } catch (e) {
    await conn.rollback()
    console.error(e)
    res.status(500).json({ ok:false, error:'server_error', detail:String(e.message || e) })
  } finally {
    conn.release()
  }
})



// POST /api/news/delete.php
app.post('/api/news/delete.php', async (req, res) => {
  const conn = await pool.getConnection()
  try {
    const { id } = req.body || {}
    if (!id) return res.status(400).json({ ok:false, error:'missing_id' })
    await conn.execute('DELETE FROM news WHERE id=?', [id])

    const dir = path.join(UPLOAD_ROOT, 'news', String(id))
    if (fs.existsSync(dir)) fs.rmSync(dir, { recursive:true, force:true })

    res.json({ ok:true })
  } catch (e) {
    console.error(e); res.status(500).json({ ok:false, error:'server_error' })
  } finally { conn.release() }
})

// GET /api/news/list.php
app.get('/api/news/list.php', async (req, res) => {
  const conn = await pool.getConnection()
  try {
    const q = (req.query.q || '').toString().trim()
    const page = Math.max(1, parseInt(req.query.page || '1', 10))
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || '12', 10)))
    const active = parseInt(req.query.active ?? '-1', 10)

    const where = []
    const params = []
    if (q) { where.push('(title LIKE ? OR body LIKE ?)'); params.push(`%${q}%`,`%${q}%`) }
    if (active === 0 || active === 1) { where.push('is_active=?'); params.push(active) }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''
    const [[{ total }]] = await conn.query(`SELECT COUNT(*) AS total FROM news ${whereSql}`, params)

    const offset = (page - 1) * limit
    const [rows] = await conn.query(
      `SELECT * FROM news ${whereSql} ORDER BY COALESCE(publish_at, created_at) DESC, id DESC LIMIT ? OFFSET ?`,
      params.concat([limit, offset])
    )

    res.json({ ok:true, items: rows, total, page, totalPages: Math.max(1, Math.ceil(total/limit)) })
  } catch (e) {
    console.error(e); res.status(500).json({ ok:false, error:'server_error' })
  } finally { conn.release() }
})

app.get('/api/news/get.php', async (req, res) => {
  const conn = await pool.getConnection()
  try {
    const id = Number(req.query.id)
    if (!id) return res.status(400).json({ ok:false, error:'missing_id' })
    const [rows] = await conn.execute('SELECT * FROM news WHERE id=?', [id])
    if (!rows.length) return res.status(404).json({ ok:false, error:'not_found' })
    res.json({ ok:true, item: rows[0] })
  } catch (e) {
    console.error(e); res.status(500).json({ ok:false, error:'server_error' })
  } finally { conn.release() }
})

/* =========================================================
   ROOMS
   ========================================================= */
// POST /api/rooms_create.php  (รองรับสองภาษา)
app.post('/api/rooms_create.php', upload.array('images[]'), async (req, res) => {
  const conn = await pool.getConnection();
  try {
    // ---- helper: ทำความสะอาดข้อความและคง \n (จะได้แสดง pre-line ได้ถูกต้อง)
    const norm = (s = '') => String(s).replace(/\r\n/g, '\n').trim();

    // รับทั้งฟิลด์เดิมและฟิลด์ภาษา
    const nameRaw_th = norm(req.body.name_th || '');
    const nameRaw_en = norm(req.body.name_en || '');
    const nameLegacy  = norm(req.body.name    || ''); // เผื่อยังยิงมาแบบเดิม

    const descRaw_th = norm(req.body.description_th || '');
    const descRaw_en = norm(req.body.description_en || '');
    const descLegacy = norm(req.body.description    || '');

    // ต้องมีชื่ออย่างน้อย 1 ภาษา
    const baseName = nameRaw_th || nameRaw_en || nameLegacy;
    if (!baseName) {
      return res.status(400).json({ ok: false, error: 'name_required' });
    }

    // description หลัก (คอลัมน์ legacy) เลือกตามลำดับ TH > EN > legacy > ค่าว่าง
    const baseDesc = descRaw_th || descRaw_en || descLegacy || '';

    // แปลงค่าว่างให้เป็น null เวลายิงเข้า DB
    const nTH = nameRaw_th || null;
    const nEN = nameRaw_en || null;
    const dTH = descRaw_th || null;
    const dEN = descRaw_en || null;
    const nBase = baseName;
    const dBase = baseDesc;

    await conn.beginTransaction();

    const [r] = await conn.execute(
      `
      INSERT INTO rooms
        (name, name_th, name_en, description, description_th, description_en)
      VALUES (?,?,?,?,?,?)
      `,
      [nBase, nTH, nEN, dBase, dTH, dEN]
    );

    const room_id = r.insertId;

    // อัปโหลดรูป (บีบอัด)
    const files = Array.isArray(req.files) ? req.files : [];
    const destDir = path.join(UPLOAD_ROOT, 'rooms', String(room_id));
    const saved = await saveManyOptimized(files, destDir); // ต้องคืน { filename, sort_order }[]

    for (const s of saved) {
      const publicPath = `${PUBLIC_BASE}/rooms/${room_id}/${s.filename}`;
      await conn.execute(
        'INSERT INTO room_images (room_id, file_path, sort_order) VALUES (?,?,?)',
        [room_id, publicPath, s.sort_order]
      );
    }

    await conn.commit();
    return res.json({
      ok: true,
      room_id,
      name: nBase,
      name_th: nTH,
      name_en: nEN,
      description: dBase,
      description_th: dTH,
      description_en: dEN,
      images: saved.map(s => `${PUBLIC_BASE}/rooms/${room_id}/${s.filename}`)
    });
  } catch (e) {
    await conn.rollback();
    console.error(e);
    return res.status(500).json({
      ok: false,
      error: 'server_error',
      detail: String(e && e.message ? e.message : e)
    });
  } finally {
    conn.release();
  }
});

app.get('/api/rooms_list.php', async (req, res) => {
  const conn = await pool.getConnection()
  try {
    const [rooms] = await conn.query('SELECT * FROM rooms ORDER BY id DESC')
    const ids = rooms.map(r => r.id)
    let imagesMap = {}
    if (ids.length) {
      const placeholders = ids.map(()=>'?').join(',')
      const [rows] = await conn.query(
        `SELECT * FROM room_images WHERE room_id IN (${placeholders}) ORDER BY sort_order, id`,
        ids
      )
      for (const img of rows) (imagesMap[img.room_id] ||= []).push(img)
    }
    const out = rooms.map(r => ({ ...r, images: imagesMap[r.id] || [] }))
    res.json({ ok:true, rooms: out })
  } catch (e) {
    console.error(e)
    res.status(500).json({ ok:false, error:'server_error' })
  } finally { conn.release() }
})

app.post('/api/rooms_delete.php', async (req, res) => {
  const conn = await pool.getConnection()
  try {
    const { room_id } = req.body || {}
    if (!room_id) return res.status(400).json({ ok:false, error:'missing_room_id' })

    await conn.beginTransaction()
    await conn.execute('DELETE FROM rooms WHERE id=?', [room_id])
    await conn.execute('DELETE FROM room_images WHERE room_id=?', [room_id])
    await conn.commit()

    const dir = path.join(UPLOAD_ROOT, 'rooms', String(room_id))
    if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true })

    res.json({ ok:true })
  } catch (e) {
    await conn.rollback()
    console.error(e)
    res.status(500).json({ ok:false, error:'server_error' })
  } finally { conn.release() }
})

/* =========================================================
   FACILITIES
   ========================================================= */

// CREATE facilities รองรับหลายภาษา
app.post('/api/facilities/create.php', upload.array('images[]'), async (req, res) => {
  const conn = await pool.getConnection()
  try {
    const category = (req.body.category || '').trim()

    const title_th = (req.body.title_th || '').trim()
    const title_en = (req.body.title_en || '').trim()
    const legacyTitle = (req.body.title || '').trim()

    const description_th = (req.body.description_th || '').trim()
    const description_en = (req.body.description_en || '').trim()
    const legacyDescription = (req.body.description || '').trim()

    if (!['hall','kitchen','activity','ambience'].includes(category)) {
      return res.status(400).json({ ok:false, error:'bad_category' })
    }

    const baseTitle = title_th || title_en || legacyTitle
    if (!baseTitle) {
      return res.status(400).json({ ok:false, error:'title_required' })
    }

    const baseDescription = description_th || description_en || legacyDescription

    await conn.beginTransaction()
    const [r] = await conn.execute(
      `INSERT INTO facilities
         (category, title, title_th, title_en,
          description, description_th, description_en)
       VALUES (?,?,?,?,?,?,?)`,
      [
        category,
        baseTitle,
        title_th || null,
        title_en || null,
        baseDescription,
        description_th || null,
        description_en || null
      ]
    )
    const fid = r.insertId

    const destDir = path.join(UPLOAD_ROOT, 'facilities', category, String(fid))
    const saved = await saveManyOptimized(req.files || [], destDir)
    for (const s of saved) {
      const publicPath = `${PUBLIC_BASE}/facilities/${category}/${fid}/${s.filename}`
      await conn.execute(
        'INSERT INTO facility_images (facility_id, file_path, sort_order) VALUES (?,?,?)',
        [fid, publicPath, s.sort_order]
      )
    }
    await conn.commit()
    res.json({ ok:true, id: fid })
  } catch (e) {
    await conn.rollback()
    console.error(e)
    res.status(500).json({ ok:false, error:'server_error', detail: String(e.message || e) })
  } finally {
    conn.release()
  }
})

app.get('/api/facilities/list.php', async (req, res) => {
  const conn = await pool.getConnection()
  try {
    const { category } = req.query
    let rows
    if (category) {
      ;[rows] = await conn.execute(
        'SELECT * FROM facilities WHERE category=? ORDER BY id DESC',
        [category]
      )
    } else {
      ;[rows] = await conn.query('SELECT * FROM facilities ORDER BY id DESC')
    }
    const ids = rows.map(r => r.id)
    let map = {}
    if (ids.length) {
      const placeholders = ids.map(()=>'?').join(',')
      const [imgs] = await conn.query(
        `SELECT * FROM facility_images WHERE facility_id IN (${placeholders}) ORDER BY sort_order, id`,
        ids
      )
      for (const img of imgs) (map[img.facility_id] ||= []).push(img)
    }
    res.json({ ok:true, items: rows.map(r => ({ ...r, images: map[r.id] || [] })) })
  } catch (e) {
    console.error(e)
    res.status(500).json({ ok:false, error:'server_error' })
  } finally {
    conn.release()
  }
})

function normalizeDateForDb(raw) {
  if (!raw) return null;

  if (typeof raw === 'string') {
    // ตัดเอาแค่ส่วน YYYY-MM-DD ถ้ามี
    const m = raw.match(/^\d{4}-\d{2}-\d{2}/);
    if (m) return m[0];
  }

  // ถ้าเป็น Date object หรือ string แปลก ๆ ที่ parse ได้
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return null;

  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}


app.post('/api/facilities/delete.php', async (req, res) => {
  const conn = await pool.getConnection()
  try {
    const { id } = req.body || {}
    if (!id) return res.status(400).json({ ok:false, error:'missing_id' })
    await conn.beginTransaction()
    await conn.execute('DELETE FROM facilities WHERE id=?', [id])
    await conn.execute('DELETE FROM facility_images WHERE facility_id=?', [id])
    await conn.commit()
    res.json({ ok:true })
  } catch (e) {
    await conn.rollback()
    console.error(e)
    res.status(500).json({ ok:false, error:'server_error' })
  } finally {
    conn.release()
  }
})

/* =========================================================
   ATTRACTIONS
   ========================================================= */

// CREATE attractions รองรับหลายภาษา
app.post('/api/attractions/create.php', upload.array('images[]'), async (req, res) => {
  const conn = await pool.getConnection()
  try {
    const title_th = (req.body.title_th || '').trim()
    const title_en = (req.body.title_en || '').trim()
    const legacyTitle = (req.body.title || '').trim()

    const description_th = (req.body.description_th || '').trim()
    const description_en = (req.body.description_en || '').trim()
    const legacyDescription = (req.body.description || '').trim()

    const map_link = (req.body.map_link || '').trim()

    const baseTitle = title_th || title_en || legacyTitle
    if (!baseTitle) return res.status(400).json({ ok:false, error:'title_required' })

    const baseDescription = description_th || description_en || legacyDescription

    await conn.beginTransaction()
    const [r] = await conn.execute(
      `INSERT INTO attractions
         (title, title_th, title_en,
          description, description_th, description_en,
          map_link)
       VALUES (?,?,?,?,?,?,?)`,
      [
        baseTitle,
        title_th || null,
        title_en || null,
        baseDescription,
        description_th || null,
        description_en || null,
        map_link || null
      ]
    )
    const aid = r.insertId

    const destDir = path.join(UPLOAD_ROOT, 'attractions', String(aid))
    const saved = await saveManyOptimized(req.files || [], destDir)
    for (const s of saved) {
      const publicPath = `${PUBLIC_BASE}/attractions/${aid}/${s.filename}`
      await conn.execute(
        'INSERT INTO attraction_images (attraction_id, file_path, sort_order) VALUES (?,?,?)',
        [aid, publicPath, s.sort_order]
      )
    }
    await conn.commit()
    res.json({ ok:true, id: aid })
  } catch (e) {
    await conn.rollback()
    console.error(e)
    res.status(500).json({ ok:false, error:'server_error', detail: String(e.message || e) })
  } finally {
    conn.release()
  }
})

app.get('/api/attractions/list.php', async (req, res) => {
  const conn = await pool.getConnection()
  try {
    const [rows] = await conn.query('SELECT * FROM attractions ORDER BY id DESC')
    const ids = rows.map(r => r.id)
    let map = {}
    if (ids.length) {
      const placeholders = ids.map(()=>'?').join(',')
      const [imgs] = await conn.query(
        `SELECT * FROM attraction_images WHERE attraction_id IN (${placeholders}) ORDER BY sort_order, id`,
        ids
      )
      for (const img of imgs) (map[img.attraction_id] ||= []).push(img)
    }
    res.json({ ok:true, items: rows.map(r => ({ ...r, images: map[r.id] || [] })) })
  } catch (e) {
    console.error(e)
    res.status(500).json({ ok:false, error:'server_error' })
  } finally {
    conn.release()
  }
})

app.post('/api/attractions/delete.php', async (req, res) => {
  const conn = await pool.getConnection()
  try {
    const { id } = req.body || {}
    if (!id) return res.status(400).json({ ok:false, error:'missing_id' })

    await conn.beginTransaction()
    await conn.execute('DELETE FROM attractions WHERE id=?', [id])
    await conn.execute('DELETE FROM attraction_images WHERE attraction_id=?', [id])
    await conn.commit()

    const dir = path.join(UPLOAD_ROOT, 'attractions', String(id))
    if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true })

    res.json({ ok:true })
  } catch (e) {
    await conn.rollback()
    console.error(e)
    res.status(500).json({ ok:false, error:'server_error' })
  } finally {
    conn.release()
  }
})

/* =========================================================
   REVIEWS
   ========================================================= */

ensureDir(path.join(UPLOAD_ROOT, 'reviews'))

// CREATE reviews รองรับ content_th / content_en
app.post('/api/reviews/create.php', upload.array('images[]'), async (req, res) => {
  const conn = await pool.getConnection()
  try {
    const author_name = (req.body.author_name || '').trim() || null
    const rating = Number(req.body.rating ?? 5) || 5

    const content_th = (req.body.content_th || '').trim()
    const content_en = (req.body.content_en || '').trim()
    const legacyContent = (req.body.content || '').trim()

    const visited_at = (req.body.visited_at || '').trim() || null

    const baseContent = content_th || content_en || legacyContent
    if (!baseContent) {
      return res.status(400).json({ ok:false, error:'content_th_required' })
    }

    await conn.beginTransaction()
    const [r] = await conn.execute(
      'INSERT INTO reviews (author_name, rating, content, content_th, content_en, visited_at) VALUES (?,?,?,?,?,?)',
      [
        author_name,
        rating,
        baseContent,
        content_th || null,
        content_en || null,
        visited_at || null
      ]
    )
    const review_id = r.insertId

    const destDir = path.join(UPLOAD_ROOT, 'reviews', String(review_id))
    const saved = await saveManyOptimized(req.files || [], destDir)
    for (const s of saved) {
      const publicPath = `${PUBLIC_BASE}/reviews/${review_id}/${s.filename}`
      await conn.execute(
        'INSERT INTO review_images (review_id, file_path, sort_order) VALUES (?,?,?)',
        [review_id, publicPath, s.sort_order]
      )
    }

    await conn.commit()
    res.json({ ok:true, id: review_id, images: saved.map(s => `${PUBLIC_BASE}/reviews/${review_id}/${s.filename}`) })
  } catch (e) {
    await conn.rollback()
    console.error(e)
    res.status(500).json({ ok:false, error:'server_error', detail:String(e.message||e) })
  } finally {
    conn.release()
  }
})

// GET /api/reviews/list.php
app.get('/api/reviews/list.php', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.execute(
      `SELECT
         id,
         author_name,
         rating,
         visited_at,
         content_th,
         content_en
       FROM reviews
       ORDER BY id DESC
       LIMIT 200`
    );

    res.json({
      ok: true,
      items: rows.map(row => ({
        id: row.id,
        author_name: row.author_name,
        rating: row.rating,
        // แปลงให้เป็น YYYY-MM-DD ก่อนส่งออก
        visited_at: normalizeDateForDb(row.visited_at),
        content_th: row.content_th,
        content_en: row.content_en,
      })),
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      ok: false,
      error: 'server_error',
      detail: String(e.message || e),
    });
  } finally {
    conn.release();
  }
});

// GET /api/reviews/detail.php
app.get('/api/reviews/detail.php', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const id = Number(req.query.id);
    if (!id) {
      return res.status(400).json({ ok: false, error: 'missing_id' });
    }

    // ดึงข้อมูลรีวิวหลัก
    const [rows] = await conn.execute(
      `SELECT
         id,
         author_name,
         rating,
         visited_at,
         content_th,
         content_en
       FROM reviews
       WHERE id = ?
       LIMIT 1`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ ok: false, error: 'not_found' });
    }

    const row = rows[0];

    // ดึงรูปทั้งหมดของรีวิวนี้
    const [imgRows] = await conn.execute(
      `SELECT * 
       FROM review_images
       WHERE review_id = ?
       ORDER BY id ASC`,
      [id]
    );

    res.json({
      ok: true,
      item: {
        id: row.id,
        author_name: row.author_name,
        rating: row.rating,
        visited_at: normalizeDateForDb(row.visited_at),
        content_th: row.content_th,
        content_en: row.content_en,
        // ส่ง array images ไปให้ frontend
        images: imgRows.map(img => ({
          id: img.id,
          url: img.file_path,   // key 'url' จะได้ตรงกับฝั่ง Vue
        })),
      },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      ok: false,
      error: 'server_error',
      detail: String(e.message || e),
    });
  } finally {
    conn.release();
  }
});

// POST /api/reviews/delete-image.php
app.post('/api/reviews/delete-image.php', upload.none(), async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const imgId = Number(req.body.id);
    if (!imgId) {
      return res.status(400).json({ ok: false, error: 'missing_id' });
    }

    await conn.execute('DELETE FROM review_images WHERE id=?', [imgId]);

    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: 'server_error', detail: String(e.message || e) });
  } finally {
    conn.release();
  }
});


// POST /api/reviews/update.php
app.post('/api/reviews/update.php', upload.array('images[]'), async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const id = Number(req.body.id);
    if (!id) {
      return res.status(400).json({ ok: false, error: 'missing_id' });
    }

    const author_name_raw = (req.body.author_name || '').trim();
    const author_name = author_name_raw || null;

    const rating = req.body.rating ? Number(req.body.rating) : null;

    // 🔧 แปลง visited_at ให้เหลือ YYYY-MM-DD
    const visited_raw = (req.body.visited_at || '').trim();
    const visited_at = normalizeDateForDb(visited_raw);

    const content_th = (req.body.content_th || '').trim();
    const content_en_raw = (req.body.content_en || '').trim();
    const content_en = content_en_raw || null;

    if (!content_th) {
      return res.status(400).json({ ok: false, error: 'content_th_required' });
    }

    const baseContent = content_th || content_en || null;

    await conn.beginTransaction();

    await conn.execute(
      `UPDATE reviews
       SET author_name = ?,
           rating      = ?,
           visited_at  = ?,
           content     = ?,
           content_th  = ?,
           content_en  = ?
       WHERE id = ?`,
      [
        author_name,
        rating,
        visited_at || null,
        baseContent,
        content_th,
        content_en,
        id,
      ]
    );

    // ถ้ามีรูปใหม่ ให้บันทึกเพิ่ม
    if (req.files && req.files.length > 0) {
      const destDir = path.join(UPLOAD_ROOT, 'reviews', String(id));
      for (const file of req.files) {
        const filename = await saveOneOptimized(file, destDir);
        const imagePath = `${PUBLIC_BASE}/reviews/${id}/${filename}`;
        await conn.execute(
          'INSERT INTO review_images (review_id, file_path) VALUES (?, ?)',
          [id, imagePath]
        );
      }
    }

    await conn.commit();
    res.json({ ok: true });
  } catch (e) {
    await conn.rollback();
    console.error(e);
    res.status(500).json({
      ok: false,
      error: 'server_error',
      detail: String(e.message || e),
    });
  } finally {
    conn.release();
  }
});


// POST /api/attractions/update.php
app.post('/api/attractions/update.php', upload.array('images[]'), async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const id = Number(req.body.id);
    if (!id) {
      return res.status(400).json({ ok: false, error: 'missing_id' });
    }

    const title_th = (req.body.title_th || '').trim();
    const title_en = (req.body.title_en || '').trim();
    const description_th = (req.body.description_th || '').trim();
    const description_en = (req.body.description_en || '').trim();
    const map_link = (req.body.map_link || '').trim() || null;

    // ถ้าอยากบังคับว่าต้องมีชื่ออย่างน้อย 1 ภาษา
    if (!title_th && !title_en) {
      return res.status(400).json({ ok: false, error: 'title_required' });
    }

    const baseTitle = title_th || title_en || null;
    const baseDescription = description_th || description_en || null;

    await conn.beginTransaction();

    // อัปเดตข้อมูลหลักของสถานที่ (ทั้ง legacy + แยกภาษา)
    await conn.execute(
      `UPDATE attractions
       SET title        = ?,
           title_th     = ?,
           title_en     = ?,
           description  = ?,
           description_th = ?,
           description_en = ?,
           map_link     = ?
       WHERE id = ?`,
      [
        baseTitle,
        title_th || null,
        title_en || null,
        baseDescription,
        description_th || null,
        description_en || null,
        map_link,
        id,
      ]
    );

    // ถ้ามีรูปใหม่ ให้บันทึกเพิ่ม
    if (req.files && req.files.length > 0) {
      const destDir = path.join(UPLOAD_ROOT, 'attractions', String(id));

      for (const file of req.files) {
        const filename = await saveOneOptimized(file, destDir);
        const filePath = `${PUBLIC_BASE}/attractions/${id}/${filename}`;

        await conn.execute(
          'INSERT INTO attraction_images (attraction_id, file_path) VALUES (?, ?)',
          [id, filePath]
        );
      }
    }

    await conn.commit();
    res.json({ ok: true });
  } catch (e) {
    await conn.rollback();
    console.error(e);
    res.status(500).json({
      ok: false,
      error: 'server_error',
      detail: String(e.message || e),
    });
  } finally {
    conn.release();
  }
});

// POST /api/attractions/delete-image.php
app.post('/api/attractions/delete-image.php', upload.none(), async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const imgId = Number(req.body.id);
    if (!imgId) {
      return res.status(400).json({ ok: false, error: 'missing_id' });
    }

    const [rows] = await conn.execute(
      'SELECT file_path, attraction_id FROM attraction_images WHERE id = ?',
      [imgId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ ok: false, error: 'not_found' });
    }

    const img = rows[0];

    await conn.execute('DELETE FROM attraction_images WHERE id = ?', [imgId]);

    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      ok: false,
      error: 'server_error',
      detail: String(e.message || e),
    });
  } finally {
    conn.release();
  }
});


app.post('/api/reviews/delete.php', async (req, res) => {
  const conn = await pool.getConnection()
  try {
    const { id } = req.body || {}
    if (!id) return res.status(400).json({ ok:false, error:'missing_id' })

    await conn.beginTransaction()
    await conn.execute('DELETE FROM reviews WHERE id=?', [id])
    await conn.execute('DELETE FROM review_images WHERE review_id=?', [id])
    await conn.commit()

    const dir = path.join(UPLOAD_ROOT, 'reviews', String(id))
    if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true })

    res.json({ ok:true })
  } catch (e) {
    await conn.rollback()
    console.error(e)
    res.status(500).json({ ok:false, error:'server_error' })
  } finally {
    conn.release()
  }
})

/* =========================================================
   SETTINGS / LINE NOTIFY
   ========================================================= */

app.get('/api/settings/get.php', async (req, res) => {
  const conn = await pool.getConnection()
  try {
    const skeys = (req.query.skeys || '').split(',').map(s=>s.trim()).filter(Boolean)
    let rows
    if (skeys.length) {
      const placeholders = skeys.map(()=>'?').join(',')
      ;[rows] = await conn.query(`SELECT skey, svalue FROM settings WHERE skey IN (${placeholders})`, skeys)
    } else {
      ;[rows] = await conn.query('SELECT skey, svalue FROM settings')
    }
    res.json({ ok:true, items: rows })
  } catch (e) {
    console.error(e)
    res.status(500).json({ ok:false, error:'server_error' })
  } finally {
    conn.release()
  }
})

app.post('/api/settings/set.php', async (req, res) => {
  const conn = await pool.getConnection()
  try {
    const { key, value = '' } = req.body || {}
    if (!key) return res.status(400).json({ ok:false, error:'missing_key' })
    await conn.execute(
      'INSERT INTO settings (skey, svalue) VALUES (?, ?) ON DUPLICATE KEY UPDATE svalue=VALUES(svalue)',
      [key, String(value)]
    )
    res.json({ ok:true })
  } catch (e) {
    console.error(e)
    res.status(500).json({ ok:false, error:'server_error' })
  } finally {
    conn.release()
  }
})

app.post('/api/notify_phone.php', async (req, res) => {
  try {
    if (!LINE_NOTIFY_TOKEN) {
      return res.status(500).json({ ok:false, error:'missing_LINE_NOTIFY_TOKEN' })
    }
    const { phone, site='Pool Villa', page='UnderConstruction' } = req.body || {}
    if (!phone) return res.status(400).json({ ok:false, error:'missing_phone' })

    const message =
      `📲 มีผู้สนใจแจ้งเบอร์โทร\n` +
      `โครงการ: ${site}\nหน้า: ${page}\nโทร: ${phone}\nเวลา: ${new Date().toLocaleString('th-TH')}`

    const r = await fetch('https://notify-api.line.me/api/notify', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + LINE_NOTIFY_TOKEN, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ message })
    })
    if (r.ok) return res.json({ ok:true })
    const text = await r.text()
    return res.status(500).json({ ok:false, error:'line_notify_failed', resp: text })
  } catch (e) {
    console.error(e)
    res.status(500).json({ ok:false, error:'server_error', detail: String(e.message || e) })
  }
})

/**
 * ตรวจว่ามีชนการจองเดิมหรือไม่ (ซ้อนช่วงวัน)
 * ช่วงวัน: [check_in, check_out) ไม่รวมวันเช็คเอาต์
 */
async function hasOverlap(conn, check_in, check_out, room_id = null) {
  // โค้ดเดิม...
  const sql =
    `SELECT COUNT(*) AS c
     FROM bookings
     WHERE status IN ('reserved','staying')
       ${room_id ? 'AND room_id = ?' : ''}
       AND NOT (check_out <= ? OR check_in >= ?)`

  const finalParams = room_id ? [room_id, check_in, check_out] : [check_in, check_out]
  const [[{ c }]] = await conn.query(sql, finalParams)
  return c > 0
}

/** GET /api/bookings/availability ... */
app.get('/api/bookings/availability', async (req, res) => {
  // ... (เหมือนเดิมทั้งหมด)
  const startStr = (req.query.start || '').slice(0, 10)
  const endStr   = (req.query.end   || '').slice(0, 10)

  const start = dayjs(startStr, 'YYYY-MM-DD', true)
  const end   = dayjs(endStr,   'YYYY-MM-DD', true)

  if (!start.isValid() || !end.isValid() || !start.isSameOrBefore(end, 'day')) {
    return res.status(400).json({ ok:false, error:'bad_range' })
  }

  const conn = await pool.getConnection()
  try {
    const [rows] = await conn.execute(
      `SELECT id, DATE(check_in)  AS ci,
              DATE(check_out) AS co, status
       FROM bookings
       WHERE status IN ('reserved','confirmed','checked_in')
         AND NOT (DATE(check_out) <= ? OR DATE(check_in) >= ?)`,
      [ startStr, endStr ]
    )

    const booked = new Set()
    for (const r of rows) {
      let d = dayjs(r.ci)
      const co = dayjs(r.co)
      while (d.isBefore(co, 'day')) {
        if (d.isSameOrBefore(end, 'day') && !d.isBefore(start, 'day')) {
          booked.add(d.format('YYYY-MM-DD'))
        }
        d = d.add(1, 'day')
      }
    }

    res.json({ ok:true, booked: Array.from(booked).sort() })
  } catch (e) {
    console.error(e)
    res.status(500).json({ ok:false, error:'server_error' })
  } finally { conn.release() }
})

/** POST /api/bookings/create ... */
app.post('/api/bookings/create', async (req, res) => {
  // ... (เหมือนเดิมทั้งหมด)
  const { full_name='', phone='', check_in='', check_out='', room_id=null, note='' } = req.body || {}
  
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm   = String(today.getMonth()+1).padStart(2,'0');
  const dd   = String(today.getDate()).padStart(2,'0');
  const todayStr = `${yyyy}-${mm}-${dd}`;
    
  if (check_in < todayStr || check_out < todayStr) {
    return res.status(400).json({ ok:false, error:'past_date_not_allowed' });
  }

  if (!full_name || !phone || !check_in || !check_out) {
    return res.status(400).json({ ok:false, error:'missing_fields' })
  }
  if (!/^\+?\d{8,15}$/.test(String(phone).replace(/\s|-/g,''))) {
    return res.status(400).json({ ok:false, error:'invalid_phone' })
  }
  if (dayjs(check_out).isSameOrBefore(dayjs(check_in))) {
    return res.status(400).json({ ok:false, error:'bad_range' })
  }

  const conn = await pool.getConnection()
  try {
    if (await hasOverlap(conn, check_in, check_out, room_id)) {
      return res.status(409).json({ ok:false, error:'date_conflict' })
    }

    await conn.commit();
    res.json({ ok: true, Date: todayStr });

    setTimeout(() => {
      notifyBooking({ id: todayStr, full_name, phone, check_in, check_out })
        .catch(err => console.error('[notifyBooking] exception', err));
    }, 0);
  } catch (e) {
    console.error(e); res.status(500).json({ ok:false, error:'server_error' })
  } finally { conn.release() }
})


// สมมติว่ามี:
// const express = require('express');
// const app = express();
// const { pool } = require('./db');
// app.use(express.json());

app.post('/api/bookings/admin/update', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const id = Number(req.body.id);
    if (!id) {
      return res.status(400).json({ ok: false, error: 'missing_id' });
    }

    const full_name = (req.body.full_name || '').trim();
    const phone = (req.body.phone || '').trim();
    const check_in = (req.body.check_in || '').slice(0, 10) || null;
    const check_out = (req.body.check_out || '').slice(0, 10) || null;
    const room_id = req.body.room_id ? Number(req.body.room_id) : null;
    const people = req.body.people ? Number(req.body.people) : 0;
    const pet_type = (req.body.pet_type || '').trim() || null;
    const pet_count = req.body.pet_count ? Number(req.body.pet_count) : 0;
    const note = (req.body.note || '').trim() || null;
    const status = (req.body.status || 'reserved').trim();

    if (!full_name || !phone || !check_in || !check_out) {
      return res.status(400).json({ ok: false, error: 'missing_fields' });
    }

    await conn.beginTransaction();

    await conn.execute(
      `UPDATE bookings
       SET full_name = ?,
           phone = ?,
           check_in = ?,
           check_out = ?,
           room_id = ?,
           people = ?,
           pet_type = ?,
           pet_count = ?,
           note = ?,
           status = ?
       WHERE id = ?`,
      [
        full_name,
        phone,
        check_in,
        check_out,
        room_id,
        people,
        pet_type,
        pet_count,
        note,
        status,
        id,
      ]
    );

    await conn.commit();
    res.json({ ok: true });
  } catch (e) {
    await conn.rollback();
    console.error(e);
    res.status(500).json({
      ok: false,
      error: 'server_error',
      detail: String(e.message || e),
    });
  } finally {
    conn.release();
  }
});

// POST /api/bookings/admin/delete
app.post('/api/bookings/admin/delete', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    // ดึง id จาก body
    const id = Number(req.body.id);
    if (!id) {
      return res.status(400).json({ ok: false, error: 'missing_id' });
    }

    await conn.beginTransaction();

    // ถ้ามีตารางลูก เช่น booking_items ให้ลบตรงนี้ก่อน (ถ้ามี)
    // await conn.execute('DELETE FROM booking_items WHERE booking_id = ?', [id]);

    // ลบแถวใน bookings
    const [r] = await conn.execute('DELETE FROM bookings WHERE id = ?', [id]);

    // ถ้าอยากเช็คว่ามีแถวให้ลบจริงไหม
    // if (r.affectedRows === 0) {
    //   await conn.rollback();
    //   return res.status(404).json({ ok: false, error: 'not_found' });
    // }

    await conn.commit();
    res.json({ ok: true });
  } catch (e) {
    await conn.rollback();
    console.error(e);
    res.status(500).json({
      ok: false,
      error: 'server_error',
      detail: String(e.message || e),
    });
  } finally {
    conn.release();
  }
});

/* =========================================================
   LINE NOTIFY & MESSAGING API PUSH
   ========================================================= */
   const LINE_NOTIFY_TOKEN = process.env.LINE_NOTIFY_TOKEN || ''
   const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN || ''
   const ADMIN_IDS = (process.env.LINE_ADMIN_USER_IDS || '').split(',').map(s => s.trim()).filter(Boolean)
   
   /** ส่งข้อความผ่าน LINE Notify */
   
   
   async function sendLineNotify(message) {
     if (!LINE_NOTIFY_TOKEN) {
       console.warn('[LINE] missing LINE_NOTIFY_TOKEN, skip notify');
       return;
     }
     const res = await fetch('https://notify-api.line.me/api/notify', {
       method: 'POST',
       headers: {
         'Authorization': 'Bearer ' + LINE_NOTIFY_TOKEN,
         'Content-Type': 'application/x-www-form-urlencoded'
       },
       body: new URLSearchParams({ message })
     });
     if (!res.ok) {
       const txt = await res.text().catch(() => '');
       console.error('[LINE] notify failed:', res.status, txt);
     }
   }
   
   /** ส่งข้อความผ่าน LINE Messaging API */
   async function linePush(to, text) {
    if (!LINE_CHANNEL_ACCESS_TOKEN) {
      console.warn('[LINE] missing LINE_CHANNEL_ACCESS_TOKEN → skip push');
      return;
    }
    try {
      const r = await fetch('https://api.line.me/v2/bot/message/push', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + LINE_CHANNEL_ACCESS_TOKEN,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ to, messages: [{ type: 'text', text }] }),
      });
      if (!r.ok) {
        const t = await r.text().catch(()=>'');
        console.error('[LINE push] failed', r.status, t);
      }
    } catch (e) {
      console.error('[LINE push] exception', e);
    }
  }
   
   /** ส่งข้อความให้แอดมินทุกคน */
   async function pushAdmins(text) {
     if (!ADMIN_IDS.length) return;
     for (const id of ADMIN_IDS) {
       await linePush(id, text).catch(console.error);
     }
   }
   
   /** ใช้รวมเมื่อมีการจองใหม่ */
   async function notifyBooking({ id, full_name, phone, check_in, check_out }) {
     const msg = [
       '📣 มีการจองใหม่จากเว็บไซต์!',
       `เลขที่การจอง: #${id}`,
       `ชื่อผู้จอง: ${full_name}`,
       `โทร: ${phone}`,
       `เช็คอิน: ${formatThaiDate(check_in)}`,
  `เช็คเอาต์: ${formatThaiDate(check_out)}`,
  `เวลาแจ้ง: ${formatThaiDateTime()}`
     ].join('\n')
   
    //  await sendLineNotify(msg)
    // await pushAdmins(msg)
        await fetch('https://api.line.me/v2/bot/message/push', {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ' + process.env.LINE_CHANNEL_ACCESS_TOKEN,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            to: process.env.LINE_ADMIN_USER_IDS,  // userId ของแอดมินที่แอดเพื่อนกับ OA แล้ว
            messages: [
              {
                type: 'text',
                text: msg
              }
            ]
          })
        })
     
        
   }
   
   // แปลง YYYY-MM-DD -> "27 พฤศจิกายน 2568"
function formatThaiDate(isoDateStr) {
  // กันปัญหา timezone โดยเติมเวลา/โซนไทย
  const dt = new Date(isoDateStr + 'T00:00:00+07:00');
  return dt.toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

// วันที่+เวลาแบบไทย -> "30 ตุลาคม 2568 19:14"
function formatThaiDateTime(date = new Date()) {
  return date.toLocaleString('th-TH', {
    dateStyle: 'long',
    timeStyle: 'short',
  });
}


/** (ทางเลือก) งานอัตโนมัติเปลี่ยนสถานะทุกเที่ยงคืน
 *  reserved -> staying เมื่อถึงวัน check_in
 *  staying  -> completed เมื่อเลยวัน check_out
 */
app.post('/api/bookings/cron-tick', async (req, res) => {
  const today = dayjs().format('YYYY-MM-DD')
  const conn = await pool.getConnection()
  try {
    await conn.execute(`UPDATE bookings SET status='staying'  WHERE status='reserved' AND check_in <= ?`, [today])
    await conn.execute(`UPDATE bookings SET status='completed' WHERE status='staying'  AND check_out <= ?`, [today])
    res.json({ ok:true })
  } catch (e) {
    console.error(e); res.status(500).json({ ok:false, error:'server_error' })
  } finally { conn.release() }
})

app.get('/api/bookings/busy', async (req, res) => {
  const conn = await pool.getConnection()
  try {
    // เดือนที่ขอ, default = เดือนปัจจุบัน
    const monthStr = (req.query.month || dayjs().format('YYYY-MM')).slice(0, 7) // YYYY-MM
    const monthStart = dayjs(`${monthStr}-01`, 'YYYY-MM-DD')
    if (!monthStart.isValid()) {
      return res.status(400).json({ ok: false, error: 'bad_month' })
    }
    const monthEnd = monthStart.endOf('month')

    // เลือกเรคคอร์ดที่ "ทับซ้อน" กับเดือนที่ขอ (ไม่ใช่แค่ภายในเดือน)
    // (NOT (checkout < monthStart OR checkin > monthEnd))
    const [rows] = await conn.execute(
      `SELECT id, check_in, check_out, status
       FROM bookings
       WHERE status IN ('reserved','confirmed','checked_in')
       AND NOT (check_out < ? OR check_in > ?)`,
      [monthStart.format('YYYY-MM-DD'), monthEnd.format('YYYY-MM-DD')]
    )

    // ขยายช่วงวันของแต่ละเรคคอร์ดเป็นรายวัน
    const busyDatesSet = new Set()
    for (const r of rows) {
      // แปลงเป็น dayjs
      let d = dayjs(r.check_in, 'YYYY-MM-DD')
      const out = dayjs(r.check_out, 'YYYY-MM-DD')

      // ไฮไลท์ตั้งแต่ check_in จนถึง "วันก่อน" check_out
      while (d.isBefore(out, 'day')) {
        // เฉพาะวันที่อยู่ในเดือนที่ขอ
        if (d.isSameOrAfter(monthStart, 'day') && d.isSameOrBefore(monthEnd, 'day')) {
          busyDatesSet.add(d.format('YYYY-MM-DD'))
        }
        d = d.add(1, 'day')
      }
    }

    res.json({
      ok: true,
      month: monthStr,
      busyDates: Array.from(busyDatesSet).sort() // ['2025-11-01','2025-11-02',...]
    })
  } catch (e) {
    console.error(e)
    res.status(500).json({ ok:false, error:'server_error' })
  } finally {
    conn.release()
  }
})


// ส่งข้อความ bot info ไปยัง user (admin) ผ่าน LINE Messaging API
app.get('/api/uid-owner', async (req, res) => {
  try {
    const TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN; // ❗️อย่ามี comma ต่อท้าย
    if (!TOKEN) {
      return res.status(500).json({ ok: false, error: 'missing_LINE_CHANNEL_ACCESS_TOKEN' });
    }

    // อนุญาตให้ส่ง userId ทาง query ?to=Uxxxxxxxxxxxxxx
    const to = (req.query.to || 'U0e11a52087a119d5f5e3b37754250591').trim();

    // 1) ดึงข้อมูลบอท
    const infoRes = await fetch('https://api.line.me/v2/bot/info', {
      headers: { Authorization: 'Bearer ' + TOKEN }
    });
    const infoText = await infoRes.text(); // จะได้ JSON string กลับมา

    // 2) push ข้อความไปยัง user (admin)
    const pushRes = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + TOKEN,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        to,
        messages: [{ type: 'text', text: infoText }]
      })
    });

    const pushText = await pushRes.text();

    if (!pushRes.ok) {
      // log ไว้ช่วยดีบัก
      console.error('[LINE push] failed:', pushRes.status, pushText);
      return res.status(500).json({ ok: false, error: 'push_failed', detail: pushText });
    }

    return res.json({
      ok: true,
      info_status: infoRes.status,
      push_status: pushRes.status
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: 'server_error', detail: String(e.message || e) });
  }
});

// รายเดือน (ADMIN): ดึงรายการจองที่ทับซ้อนกับช่วง start..end
// GET /api/bookings/admin/month?start=2025-10-01&end=2025-10-31
app.get('/api/bookings/admin/month', auth, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    // รับช่วงวันที่
    let { start = '', end = '' } = req.query || {};
    start = String(start).trim();
    end   = String(end).trim();

    // helper ตรวจรูปแบบ YYYY-MM-DD
    const isISO = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s);

    // ถ้าไม่ส่งมา / ส่งมาไม่ตรง format -> ใช้เดือนปัจจุบันเป็นค่าเริ่มต้น
    if (!isISO(start) || !isISO(end)) {
      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const first = `${y}-${m}-01`;
      // วันสุดท้ายของเดือน
      const lastDate = new Date(y, now.getMonth() + 1, 0).getDate();
      const last = `${y}-${m}-${String(lastDate).padStart(2, '0')}`;
      start = first;
      end = last;
    }

    // เงื่อนไข "ทับซ้อนช่วง": check_in <= end และ check_out >= start
    const sql = `
      SELECT
        id, full_name, phone,people,
        DATE_FORMAT(check_in,  '%Y-%m-%d') AS check_in,
        DATE_FORMAT(check_out, '%Y-%m-%d') AS check_out,
        status, room_id, pet_type, pet_count, note,
        created_at, updated_at
      FROM bookings WHERE check_in  <= ? AND check_out >= ? ORDER BY check_in ASC, id ASC
    `;

    const [rows] = await conn.execute(sql, [end, start]);

    return res.json({ ok: true, items: rows, range: { start, end } });
  } catch (e) {
    console.error('[admin/month] error:', e);
    return res.status(500).json({ ok: false, error: 'server_error' });
  } finally {
    conn.release();
  }
});

// ====== BOOKINGS CREATE (admin) ======
// ===== Admin create booking =====
app.post('/api/bookings/admin/create', auth, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const {
      full_name = '',
      phone = '',
      check_in = '',
      check_out = '',
      room_id = null,
      people = 0,
      pet_type = '',
      pet_count = 0,
      note = '',
      status = 'reserved',
    } = req.body || {};

    // --- helpers ---
    const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;
    const isISO = (s) => ISO_RE.test(String(s || ''));
    const toDate = (s) => {
      const [y, m, d] = s.split('-').map(Number);
      return new Date(y, m - 1, d);
    };
    const cmp = (a, b) => {
      const da = new Date(a.getFullYear(), a.getMonth(), a.getDate());
      const db = new Date(b.getFullYear(), b.getMonth(), b.getDate());
      if (da < db) return -1;
      if (da > db) return 1;
      return 0;
    };

    // --- validate fields ---
    if (!full_name.trim()) return res.status(400).json({ ok: false, error: 'full_name_required' });
    if (!isISO(check_in) || !isISO(check_out)) {
      return res.status(400).json({ ok: false, error: 'date_format_invalid', detail: 'use YYYY-MM-DD' });
    }

    const dIn = toDate(check_in);
    const dOut = toDate(check_out);

    // อนุญาตวันเดียวกัน (dIn == dOut) และต้องไม่ให้ check_in > check_out
    if (cmp(dIn, dOut) === 1) {
      return res.status(400).json({ ok: false, error: 'date_range_invalid', detail: 'check_in must be <= check_out' });
    }

    await conn.beginTransaction();

    // --- ตรวจชนกัน (overlap) ---
    // ✅ ใช้ช่วงแบบ [check_in, check_out) (ไม่รวมวัน check_out)
    // ชนกันเมื่อ: existing.check_out > new.check_in AND existing.check_in < new.check_out
    // แบบนี้จะ "อนุญาต" 31->1 และ 1->2
    const [overlap] = await conn.execute(
      `
      SELECT id, full_name, check_in, check_out, room_id, status
      FROM bookings
      WHERE status IN ('reserved','checked_in')
        AND check_out > ?
        AND check_in  < ?
        ${room_id ? 'AND (room_id IS NULL OR room_id = ?)' : ''}
      ORDER BY check_in ASC
      `,
      room_id ? [check_in, check_out, room_id] : [check_in, check_out]
    );

    if (overlap.length) {
      await conn.rollback();
      return res.status(409).json({ ok: false, error: 'date_overlap', items: overlap });
    }

    // --- insert ---
    const [r] = await conn.execute(
      `
      INSERT INTO bookings
        (full_name, phone, check_in, check_out, status, room_id, people, pet_type, pet_count, note)
      VALUES
        (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        full_name.trim(),
        phone.trim(),
        check_in,
        check_out,
        status,
        room_id ?? null,
        Number(people) || 0,
        pet_type?.trim() || null,
        Number(pet_count) || 0,
        note?.trim() || null,
      ]
    );
    const id = r.insertId;

    await conn.commit();
    res.json({ ok: true, id });
  } catch (e) {
    try { await conn.rollback(); } catch {}
    console.error('[admin/create] ', e);
    res.status(500).json({ ok: false, error: 'server_error', detail: String(e.message || e) });
  } finally {
    conn.release();
  }
});



app.patch('/api/bookings/admin/update', auth, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const isoDate = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);

    const {
      id,
      full_name,
      phone,
      check_in,
      check_out,
      status,
      room_id,
      people,
      pet_type,
      pet_count,
      pets_note,
      note,
    } = req.body || {};

    const bookingId = Number(id);
    if (!bookingId) return res.status(400).json({ ok: false, error: 'missing_id' });

    // 1) โหลดข้อมูลเดิมก่อน เพื่อประกอบค่าใหม่ให้ครบ
    const [oldRows] = await conn.query(
      `SELECT
         id, full_name, phone,
         DATE_FORMAT(check_in,'%Y-%m-%d')  AS check_in,
         DATE_FORMAT(check_out,'%Y-%m-%d') AS check_out,
         status, room_id, people, pet_type, pet_count, pets_note, note
       FROM bookings
       WHERE id=? LIMIT 1`,
      [bookingId]
    );
    if (!oldRows.length) return res.status(404).json({ ok: false, error: 'not_found' });
    const old = oldRows[0];

    // 2) สร้างค่า "ใหม่" (ถ้าไม่ส่งมาก็ใช้ค่าเดิม)
    const newCheckIn  = (check_in  !== undefined && check_in  !== null) ? String(check_in).slice(0,10)  : old.check_in;
    const newCheckOut = (check_out !== undefined && check_out !== null) ? String(check_out).slice(0,10) : old.check_out;

    const newRoomId = (room_id !== undefined)
      ? (room_id === null || room_id === '' ? null : Number(room_id))
      : old.room_id;

    // 3) validate วันที่ ถ้ามีการแตะวัน
    if (!isoDate(newCheckIn))  return res.status(400).json({ ok: false, error: 'bad_check_in' });
    if (!isoDate(newCheckOut)) return res.status(400).json({ ok: false, error: 'bad_check_out' });

    // อนุญาตวันเดียวกันได้ (in == out) และห้าม in > out
    if (newCheckIn > newCheckOut) {
      return res.status(400).json({ ok: false, error: 'date_range_invalid', detail: 'check_in must be <= check_out' });
    }

    // 4) ถ้ามีการเปลี่ยนวันหรือห้อง → เช็คชนกัน (half-open) และตัดตัวเองออก
    const touchesDateOrRoom =
      (check_in !== undefined) || (check_out !== undefined) || (room_id !== undefined);

    if (touchesDateOrRoom) {
      const [overlap] = await conn.execute(
        `
        SELECT id, full_name, check_in, check_out, room_id, status
        FROM bookings
        WHERE id <> ?
          AND status IN ('reserved','checked_in')
          AND check_out > ?     -- strict >
          AND check_in  < ?     -- strict <
          ${newRoomId ? 'AND (room_id IS NULL OR room_id = ?)' : ''}
        ORDER BY check_in ASC
        LIMIT 50
        `,
        newRoomId
          ? [bookingId, newCheckIn, newCheckOut, newRoomId]
          : [bookingId, newCheckIn, newCheckOut]
      );

      if (overlap.length) {
        return res.status(409).json({ ok: false, error: 'date_overlap', items: overlap });
      }
    }

    // 5) update แบบ dynamic เฉพาะฟิลด์ที่ส่งมา
    const fields = [];
    const params = [];
    const add = (k, v) => {
      if (v !== undefined) {
        fields.push(`${k}=?`);
        params.push(v);
      }
    };

    add('full_name', full_name !== undefined ? String(full_name).trim() : undefined);
    add('phone', phone !== undefined ? String(phone).trim() : undefined);
    add('status', status !== undefined ? String(status).trim() : undefined);

    add('check_in', check_in !== undefined ? newCheckIn : undefined);
    add('check_out', check_out !== undefined ? newCheckOut : undefined);

    add('room_id', room_id !== undefined ? (newRoomId ?? null) : undefined);

    add('people', people !== undefined ? (Number(people) || 0) : undefined);
    add('pet_type', pet_type !== undefined ? (String(pet_type).trim() || null) : undefined);
    add('pet_count', pet_count !== undefined ? (Number(pet_count) || 0) : undefined);
    add('pets_note', pets_note !== undefined ? (String(pets_note).trim() || null) : undefined);
    add('note', note !== undefined ? (String(note).trim() || null) : undefined);

    if (!fields.length) return res.json({ ok: true }); // ไม่มีอะไรให้แก้

    params.push(bookingId);
    await conn.execute(`UPDATE bookings SET ${fields.join(', ')} WHERE id=?`, params);

    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: 'server_error', detail: String(e.message || e) });
  } finally {
    conn.release();
  }
});


app.get('/api/bookings/admin/get', auth, async (req,res)=>{
  const conn = await pool.getConnection();
  try{
    const id = Number(req.query.id || 0);
    if (!id) return res.status(400).json({ ok:false, error:'missing_id' });

    const [rows] = await conn.query(
      `SELECT
         id, full_name, phone,
         DATE_FORMAT(check_in,'%Y-%m-%d') AS check_in,
         DATE_FORMAT(check_out,'%Y-%m-%d') AS check_out,
         status, room_id, people, pet_type, pet_count, pets_note, note,
         created_at, updated_at
       FROM bookings WHERE id=? LIMIT 1`, [id]
    );
    if (!rows.length) return res.status(404).json({ ok:false, error:'not_found' });

    res.json({ ok:true, item: rows[0] })
  }catch(e){
    console.error(e);
    res.status(500).json({ ok:false, error:'server_error' })
  }finally{ conn.release() }
});

// ====== BOOKINGS RANGE (admin calendar) ======
const isoDate = s => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);

app.get('/api/bookings/admin/range', auth, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    let { start = '', end = '', q = '' } = req.query || {};

    // default ช่วงเป็นเดือนปัจจุบัน + buffer
    const now = new Date();
    if (!isoDate(start)) {
      const y = now.getFullYear(), m = now.getMonth();
      start = new Date(y, m, 1).toISOString().slice(0,10);
    }
    if (!isoDate(end)) {
      const y = now.getFullYear(), m = now.getMonth();
      // สิ้นเดือน + 7 วัน buffer
      const last = new Date(y, m + 1, 0);
      const plus = new Date(last.getTime() + 7*86400000);
      end = plus.toISOString().slice(0,10);
    }

    // overlap: (check_out > start) AND (check_in < end)
    const where = ['check_out > ? AND check_in < ?'];
    const params = [start, end];

    q = (q || '').trim();
    if (q) { where.push('full_name LIKE ?'); params.push(`%${q}%`); }

    const sql = `
      SELECT
        id, full_name, phone,
        DATE_FORMAT(check_in, '%Y-%m-%d')   AS check_in,
        DATE_FORMAT(check_out, '%Y-%m-%d')  AS check_out,
        status, room_id, people, pet_type, pet_count, pets_note, note
      FROM bookings
      WHERE ${where.join(' AND ')}
      ORDER BY check_in, id
    `;
    const [rows] = await conn.query(sql, params);

    res.json({ ok: true, items: rows });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: 'server_error' });
  } finally {
    conn.release();
  }
});

// GET /api/slides - สำหรับหน้า Home
app.get('/api/slides', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, file_path, alt_text, sort_order
       FROM home_slides
       WHERE is_active=1
       ORDER BY sort_order ASC, id ASC`
    );
    res.json({ ok: true, items: rows });
  } catch (e) {
    console.error('[slides] list error:', e);
    res.status(500).json({ ok: false, error: 'server_error' });
  }
});

// GET /api/admin/slides
app.get('/api/admin/slides', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, file_path, alt_text, sort_order, is_active,
              DATE_FORMAT(created_at,'%Y-%m-%d %H:%i:%s') created_at,
              DATE_FORMAT(updated_at,'%Y-%m-%d %H:%i:%s') updated_at
       FROM home_slides
       ORDER BY sort_order ASC, id ASC`
    );
    res.json({ ok: true, items: rows });
  } catch (e) {
    console.error('[admin slides] list error:', e);
    res.status(500).json({ ok: false, error: 'server_error' });
  }
});

// POST /api/admin/slides
// body: { file_path, alt_text, sort_order?, is_active? }
app.post('/api/admin/slides', auth, async (req, res) => {
  try {
    const { file_path, alt_text='', sort_order=0, is_active=1 } = req.body || {};
    if (!file_path) return res.status(400).json({ ok: false, error: 'file_path_required' });

    const [rs] = await pool.query(
      `INSERT INTO home_slides (file_path, alt_text, sort_order, is_active)
       VALUES (?, ?, ?, ?)`,
      [file_path, alt_text, sort_order|0, is_active?1:0]
    );
    res.json({ ok: true, id: rs.insertId });
  } catch (e) {
    console.error('[admin slides] create error:', e);
    res.status(500).json({ ok: false, error: 'server_error' });
  }
});

// PUT /api/admin/slides/:id
// body: { file_path?, alt_text?, sort_order?, is_active? }
app.put('/api/admin/slides/:id', auth, async (req, res) => {
  try {
    const id = +req.params.id;
    const { file_path, alt_text, sort_order, is_active } = req.body || {};
    const fields = [];
    const vals = [];

    if (file_path !== undefined){ fields.push('file_path=?'); vals.push(file_path); }
    if (alt_text !== undefined){ fields.push('alt_text=?'); vals.push(alt_text); }
    if (sort_order !== undefined){ fields.push('sort_order=?'); vals.push(sort_order|0); }
    if (is_active !== undefined){ fields.push('is_active=?'); vals.push(is_active?1:0); }

    if (fields.length === 0) return res.json({ ok: true });
    vals.push(id);

    await pool.query(`UPDATE home_slides SET ${fields.join(', ')} WHERE id=?`, vals);
    res.json({ ok: true });
  } catch (e) {
    console.error('[admin slides] update error:', e);
    res.status(500).json({ ok: false, error: 'server_error' });
  }
});

// DELETE /api/admin/slides/:id
app.delete('/api/admin/slides/:id', auth, async (req, res) => {
  try {
    const id = +req.params.id;
    await pool.query('DELETE FROM home_slides WHERE id=?', [id]);
    res.json({ ok: true });
  } catch (e) {
    console.error('[admin slides] delete error:', e);
    res.status(500).json({ ok: false, error: 'server_error' });
  }
});

// PATCH /api/admin/slides/reorder
// body: { orders: [{id:1, sort_order:1}, ...] }
app.patch('/api/admin/slides/reorder', auth, async (req, res) => {
  try {
    const { orders=[] } = req.body || {};
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      for (const o of orders) {
        await conn.query('UPDATE home_slides SET sort_order=? WHERE id=?', [o.sort_order|0, o.id|0]);
      }
      await conn.commit();
      res.json({ ok: true });
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  } catch (e) {
    console.error('[admin slides] reorder error:', e);
    res.status(500).json({ ok: false, error: 'server_error' });
  }
});

// ============= UPLOAD FOR HOME SLIDES =============
// POST /api/admin/slides/upload  (multipart/form-data, field: "file")
// return: { ok:true, path: "<PUBLIC_BASE>/slides/<filename>.webp" }
app.post('/api/admin/slides/upload', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ ok:false, error:'missing_file' })
    }

    // บีบอัด/ย่อภาพ -> .webp (~<=90KB) ด้วย sharp (ใช้ helper ที่ประกาศไว้ด้านบน)
    const destDir = path.join(UPLOAD_ROOT, 'slides')
    const filename = await saveOneOptimized(req.file, destDir)

    // สร้าง path สำหรับฝั่ง client เรียกดู
    const publicPath = `${PUBLIC_BASE}/slides/${filename}`

    // ตอบกลับ (หน้า AdminSlide.vue จะนำ path นี้ไป POST /api/admin/slides ต่อ)
    res.json({ ok:true, path: publicPath })
  } catch (e) {
    console.error('[slides/upload] error:', e)
    res.status(500).json({ ok:false, error:'server_error', detail:String(e.message||e) })
  }
})

/* =========================
   BLOG / POSTS (SEO)
   ========================= */

// ---------- Utils ----------
function mergeLang(row, lang='th') {
  // ทำให้ response ใช้ key กลาง: title, excerpt, body, meta_title, meta_desc
  const pick = (th, en) => (lang === 'en' ? (en || th) : th);
  return {
    id: row.id,
    slug: row.slug,
    title: pick(row.title_th, row.title_en),
    excerpt: pick(row.excerpt_th, row.excerpt_en),
    body: pick(row.body_th, row.body_en),
    cover_path: row.cover_path,
    og_image_path: row.og_image_path,
    meta_title: pick(row.meta_title_th, row.meta_title_en) || null,
    meta_desc: pick(row.meta_desc_th, row.meta_desc_en) || null,
    canonical_url: row.canonical_url,
    status: row.status,
    publish_at: row.publish_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
    is_active: row.is_active,
  };
}

// ---------- Public: list ----------
app.get('/api/posts', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const lang   = (req.query.lang || 'th').toString().toLowerCase() === 'en' ? 'en' : 'th';
    const q      = (req.query.q || '').toString().trim();
    const tag    = (req.query.tag || '').toString().trim();
    const page   = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit  = Math.min(50, Math.max(1, parseInt(req.query.limit || '12', 10)));
    const offset = (page - 1) * limit;

    const where = ["status='published'", 'is_active=1'];
    const params = [];

    if (q) {
      where.push('(title_th LIKE ? OR title_en LIKE ? OR body_th LIKE ? OR body_en LIKE ?)');
      params.push(`%${q}%`,`%${q}%`,`%${q}%`,`%${q}%`);
    }
    if (tag) {
      where.push(`id IN (SELECT post_id FROM post_tags WHERE tag=?)`);
      params.push(tag);
    }

    const whereSql = 'WHERE ' + where.join(' AND ');
    const [[{total}]] = await conn.query(`SELECT COUNT(*) total FROM posts ${whereSql}`, params);

    const [rows] = await conn.query(
      `SELECT id, slug, title_th, title_en, excerpt_th, excerpt_en,
              body_th, body_en, cover_path, og_image_path,
              meta_title_th, meta_title_en, meta_desc_th, meta_desc_en,
              canonical_url, status,
              DATE_FORMAT(publish_at,'%Y-%m-%d %H:%i:%s') publish_at,
              DATE_FORMAT(created_at,'%Y-%m-%d %H:%i:%s') created_at,
              DATE_FORMAT(updated_at,'%Y-%m-%d %H:%i:%s') updated_at,
              is_active
       FROM posts ${whereSql}
       ORDER BY COALESCE(publish_at, created_at) DESC, id DESC
       LIMIT ? OFFSET ?`,
      params.concat([limit, offset])
    );

    const items = rows.map(r => mergeLang(r, lang));
    res.json({ ok:true, items, page, total, totalPages: Math.max(1, Math.ceil(total/limit)) });
  } catch (e) {
    console.error('[posts] list error:', e);
    res.status(500).json({ ok:false, error:'server_error' });
  } finally { conn.release(); }
});

// ---------- Public: get by id or slug ----------
app.get('/api/posts/get', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const lang = (req.query.lang || 'th').toString().toLowerCase()==='en'?'en':'th';
    const id   = parseInt(req.query.id || '0', 10);
    const slug = (req.query.slug || '').toString().trim();

    if (!id && !slug) return res.status(400).json({ ok:false, error:'missing_id_or_slug' });

    const cond = id ? 'id=?' : 'slug=?';
    const key  = id ? id : slug;

    const [rows] = await conn.query(
      `SELECT id, slug, title_th, title_en, excerpt_th, excerpt_en,
              body_th, body_en, cover_path, og_image_path,
              meta_title_th, meta_title_en, meta_desc_th, meta_desc_en,
              canonical_url, status,
              DATE_FORMAT(publish_at,'%Y-%m-%d %H:%i:%s') publish_at,
              DATE_FORMAT(created_at,'%Y-%m-%d %H:%i:%s') created_at,
              DATE_FORMAT(updated_at,'%Y-%m-%d %H:%i:%s') updated_at,
              is_active
       FROM posts WHERE ${cond} LIMIT 1`,
      [key]
    );
    if (!rows.length) return res.status(404).json({ ok:false, error:'not_found' });

    // รูปประกอบ
    const [imgs] = await conn.query(
      `SELECT id, file_path, sort_order
       FROM post_images WHERE post_id=? ORDER BY sort_order, id`,
       [rows[0].id]
    );
    // แท็ก
    const [tags] = await conn.query(
      `SELECT tag FROM post_tags WHERE post_id=? ORDER BY tag`,
      [rows[0].id]
    );

    const item = mergeLang(rows[0], lang);
    item.images = imgs;
    item.tags   = tags.map(t=>t.tag);

    res.json({ ok:true, item });
  } catch (e) {
    console.error('[posts] get error:', e);
    res.status(500).json({ ok:false, error:'server_error' });
  } finally { conn.release(); }
});


// ======================= ADMIN (ต้อง auth) =======================

// List ทั้งหมด (สำหรับตารางหลังบ้าน)
app.get('/api/admin/posts', auth, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const q      = (req.query.q || '').toString().trim();
    const status = (req.query.status || '').toString().trim();   // draft|published|archived|'' (ทั้งหมด)
    const tag    = (req.query.tag || '').toString().trim();
    const page   = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit  = Math.min(50, Math.max(1, parseInt(req.query.limit || '20', 10)));
    const offset = (page - 1) * limit;

    const where = ['1=1'];
    const params = [];
    if (q) {
      where.push('(title_th LIKE ? OR title_en LIKE ? OR body_th LIKE ? OR body_en LIKE ?)');
      params.push(`%${q}%`,`%${q}%`,`%${q}%`,`%${q}%`);
    }
    if (status && ['draft','published','archived'].includes(status)) {
      where.push('status=?'); params.push(status);
    }
    if (tag) {
      where.push(`id IN (SELECT post_id FROM post_tags WHERE tag=?)`);
      params.push(tag);
    }

    const whereSql = 'WHERE ' + where.join(' AND ');
    const [[{total}]] = await conn.query(`SELECT COUNT(*) total FROM posts ${whereSql}`, params);

    const [rows] = await conn.query(
      `SELECT id, slug, title_th, title_en, cover_path, status,
              DATE_FORMAT(publish_at,'%Y-%m-%d %H:%i:%s') publish_at,
              DATE_FORMAT(created_at,'%Y-%m-%d %H:%i:%s') created_at,
              DATE_FORMAT(updated_at,'%Y-%m-%d %H:%i:%s') updated_at,
              is_active
       FROM posts ${whereSql}
       ORDER BY updated_at DESC, id DESC
       LIMIT ? OFFSET ?`,
      params.concat([limit, offset])
    );
    res.json({ ok:true, items: rows, page, total, totalPages: Math.max(1, Math.ceil(total/limit)) });
  } catch (e) {
    console.error('[admin posts] list error:', e);
    res.status(500).json({ ok:false, error:'server_error' });
  } finally { conn.release(); }
});

// Create (รองรับอัปโหลด cover)
// form-data: slug, title_th, title_en, excerpt_th, excerpt_en, body_th, body_en,
//            meta_title_th, meta_title_en, meta_desc_th, meta_desc_en,
//            canonical_url, status, publish_at, tags (comma-separated), cover (file)
app.post('/api/admin/posts', auth, upload.single('cover'), async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const b = req.body || {};
    const slug = (b.slug || '').trim();
    if (!slug) return res.status(400).json({ ok:false, error:'slug_required' });
    if (!b.title_th) return res.status(400).json({ ok:false, error:'title_th_required' });

    await conn.beginTransaction();

    const [r] = await conn.execute(
      `INSERT INTO posts
       (slug, title_th, title_en, excerpt_th, excerpt_en, body_th, body_en,
        meta_title_th, meta_title_en, meta_desc_th, meta_desc_en,
        canonical_url, status, publish_at, is_active)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,1)`,
      [
        slug, b.title_th || null, b.title_en || null,
        b.excerpt_th || null, b.excerpt_en || null,
        b.body_th || null, b.body_en || null,
        b.meta_title_th || null, b.meta_title_en || null,
        b.meta_desc_th || null, b.meta_desc_en || null,
        b.canonical_url || null,
        ['draft','published','archived'].includes(b.status) ? b.status : 'draft',
        b.publish_at || null
      ]
    );
    const id = r.insertId;

    // cover
    let cover_path = null;
    if (req.file) {
      const destDir = path.join(UPLOAD_ROOT, 'posts', String(id));
      const filename = await saveOneOptimized(req.file, destDir);
      cover_path = `${PUBLIC_BASE}/posts/${id}/${filename}`;
      await conn.execute('UPDATE posts SET cover_path=? WHERE id=?', [cover_path, id]);
    }

    // tags
    if (b.tags) {
      const tags = String(b.tags).split(',').map(s=>s.trim()).filter(Boolean);
      for (const t of tags) {
        await conn.execute('INSERT IGNORE INTO post_tags (post_id, tag) VALUES (?,?)', [id, t]);
      }
    }

    await conn.commit();
    res.json({ ok:true, id, cover_path });
  } catch (e) {
    try { await conn.rollback(); } catch {}
    console.error('[admin posts] create error:', e);
    res.status(500).json({ ok:false, error:'server_error' });
  } finally { conn.release(); }
});

// Update (optional cover)
app.put('/api/admin/posts/:id', auth, upload.single('cover'), async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const id = +req.params.id;
    if (!id) return res.status(400).json({ ok:false, error:'missing_id' });
    const b = req.body || {};

    await conn.beginTransaction();

    const fields = []; const params = [];
    const add = (k,v)=>{ if (v !== undefined) { fields.push(`${k}=?`); params.push(v || null); } };

    add('slug', (b.slug||'').trim() || null);
    add('title_th', b.title_th);
    add('title_en', b.title_en);
    add('excerpt_th', b.excerpt_th);
    add('excerpt_en', b.excerpt_en);
    add('body_th', b.body_th);
    add('body_en', b.body_en);
    add('meta_title_th', b.meta_title_th);
    add('meta_title_en', b.meta_title_en);
    add('meta_desc_th', b.meta_desc_th);
    add('meta_desc_en', b.meta_desc_en);
    add('canonical_url', b.canonical_url);
    if (b.status && ['draft','published','archived'].includes(b.status)) add('status', b.status);
    if (b.publish_at !== undefined) add('publish_at', b.publish_at);
    if (b.is_active !== undefined) add('is_active', String(b.is_active)==='1'?1:0);

    if (req.file) {
      const destDir = path.join(UPLOAD_ROOT, 'posts', String(id));
      const filename = await saveOneOptimized(req.file, destDir);
      const cover_path = `${PUBLIC_BASE}/posts/${id}/${filename}`;
      add('cover_path', cover_path);
    }

    if (fields.length) {
      params.push(id);
      await conn.execute(`UPDATE posts SET ${fields.join(', ')} WHERE id=?`, params);
    }

    // อัปเดตแท็ก (ถ้าส่งมา)
    if (b.tags !== undefined) {
      await conn.execute('DELETE FROM post_tags WHERE post_id=?', [id]);
      const tags = String(b.tags||'').split(',').map(s=>s.trim()).filter(Boolean);
      for (const t of tags) {
        await conn.execute('INSERT IGNORE INTO post_tags (post_id, tag) VALUES (?,?)', [id, t]);
      }
    }

    await conn.commit();
    res.json({ ok:true });
  } catch (e) {
    try { await conn.rollback(); } catch {}
    console.error('[admin posts] update error:', e);
    res.status(500).json({ ok:false, error:'server_error' });
  } finally { conn.release(); }
});

// Delete
app.delete('/api/admin/posts/:id', auth, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const id = +req.params.id;
    if (!id) return res.status(400).json({ ok:false, error:'missing_id' });

    await conn.beginTransaction();
    await conn.execute('DELETE FROM posts WHERE id=?', [id]);
    await conn.commit();

    const dir = path.join(UPLOAD_ROOT, 'posts', String(id));
    if (fs.existsSync(dir)) fs.rmSync(dir, { recursive:true, force:true });

    res.json({ ok:true });
  } catch (e) {
    try { await conn.rollback(); } catch {}
    console.error('[admin posts] delete error:', e);
    res.status(500).json({ ok:false, error:'server_error' });
  } finally { conn.release(); }
});

// อัปโหลดรูปแกลเลอรีในบทความ
// form-data: images[] (multiple)
app.post('/api/admin/posts/:id/images', auth, upload.array('images[]'), async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const id = +req.params.id;
    if (!id) return res.status(400).json({ ok:false, error:'missing_id' });

    const destDir = path.join(UPLOAD_ROOT, 'posts', String(id));
    const saved = await saveManyOptimized(req.files || [], destDir);
    for (const s of saved) {
      const publicPath = `${PUBLIC_BASE}/posts/${id}/${s.filename}`;
      await conn.execute(
        'INSERT INTO post_images (post_id, file_path, sort_order) VALUES (?,?,?)',
        [id, publicPath, s.sort_order]
      );
    }
    res.json({ ok:true, images: saved.map(s => `${PUBLIC_BASE}/posts/${id}/${s.filename}`) });
  } catch (e) {
    console.error('[admin posts] add images error:', e);
    res.status(500).json({ ok:false, error:'server_error' });
  } finally { conn.release(); }
});

// ลบรูปในบทความ
app.delete('/api/admin/posts/:id/images/:imageId', auth, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const id = +req.params.id;
    const imageId = +req.params.imageId;
    if (!id || !imageId) return res.status(400).json({ ok:false, error:'missing_ids' });

    await conn.execute('DELETE FROM post_images WHERE id=? AND post_id=?', [imageId, id]);
    res.json({ ok:true });
  } catch (e) {
    console.error('[admin posts] delete image error:', e);
    res.status(500).json({ ok:false, error:'server_error' });
  } finally { conn.release(); }
});

// เรียงรูปใหม่
// body: { orders: [{id:1, sort_order:0}, ...] }
app.patch('/api/admin/posts/:id/images/reorder', auth, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const id = +req.params.id;
    const orders = Array.isArray(req.body?.orders) ? req.body.orders : [];
    await conn.beginTransaction();
    for (const o of orders) {
      await conn.execute('UPDATE post_images SET sort_order=? WHERE id=? AND post_id=?', [o.sort_order|0, o.id|0, id]);
    }
    await conn.commit();
    res.json({ ok:true });
  } catch (e) {
    try { await conn.rollback(); } catch {}
    console.error('[admin posts] reorder images error:', e);
    res.status(500).json({ ok:false, error:'server_error' });
  } finally { conn.release(); }
});

/* =========================
   BLOG (public, i18n-ready)
   ========================= */

// ช่วยสร้าง expression เลือกคอลัมน์ตามภาษา พร้อม fallback ไป TH ถ้า EN ว่าง
function colI18n(field, lang) {
  // field: 'title' | 'excerpt' | 'body' | 'meta_title' | 'meta_desc'
  const th = `${field}_th`;
  const en = `${field}_en`;
  if (lang === 'en') return `COALESCE(${en}, ${th})`;
  return `${th}`; // ถ้า lang='th' ก็ใช้ TH ตรง ๆ
}

// สร้าง where เงื่อนไข "public เผยแพร่แล้ว"
function wherePublic() {
  return `p.is_active=1 AND p.status='published' AND (p.publish_at IS NULL OR p.publish_at <= NOW())`;
}

/**
 * GET /api/posts/list
 * Query:
 *  - lang=th|en   (default th)
 *  - q=...        (search ใน title/excerpt/body ของภาษาที่เลือก)
 *  - tag=...      (ฟิลเตอร์แท็ก)
 *  - page=1       (default 1)
 *  - limit=9      (default 9, max 50)
 */
app.get('/api/posts/list', async (req, res) => {
  const conn = await pool.getConnection();
  console.log('req.query- ',req.query);
  try {
    const lang  = (req.query.lang || 'th').toLowerCase() === 'en' ? 'en' : 'th';
    const q     = (req.query.q || '').trim();
    const tag   = (req.query.tag || '').trim();
    const page  = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || '9', 10)));
    const offset = (page - 1) * limit;

    // dynamic i18n columns
    const colTitle   = colI18n('title', lang);
    const colExcerpt = colI18n('excerpt', lang);
    const colBody    = colI18n('body', lang);

    // build WHERE
    const where = [ wherePublic() ];
    const params = [];
    
    if (q) {
      // ค้นหา in title/excerpt/body ของภาษาที่เลือก (fallback ใน colTitle/colExcerpt/colBody ถูกจัดการแล้ว)
      where.push(`(${colTitle} LIKE ? OR ${colExcerpt} LIKE ? OR ${colBody} LIKE ?)`);
      params.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }

    if (tag) {
      // ฟิลเตอร์แท็กด้วย EXISTS (รวดเร็วและแม่น)
      where.push(`EXISTS (SELECT 1 FROM post_tags t WHERE t.post_id=p.id AND t.tag=?)`);
      params.push(tag);
    }

    const whereSql = `WHERE ${where.join(' AND ')}`;

    // นับรวม
    const [[{ total }]] = await conn.query(
      `SELECT COUNT(*) AS total
         FROM posts p
       ${whereSql}`,
      params
    );
    // รายการ
    const [rows] = await conn.query(
      `SELECT * FROM posts ORDER BY id DESC`,
      params.concat([limit, offset])
    );

    // รวบรวม id เพื่อดึง tags และรูป (หากต้องการ)
    const ids = rows.map(r => r.id);
    const tagsMap = {};
    if (ids.length) {
      const placeholders = ids.map(()=>'?').join(',');
      const [tagRows] = await conn.query(
        `SELECT post_id, tag
          FROM post_tags
          WHERE post_id IN (${placeholders})
          ORDER BY tag`,
        ids
      );
      for (const t of tagRows) {
        (tagsMap[t.post_id] ||= []).push(t.tag);
      }
    }

    // map ผลลัพธ์
    const items = rows.map(r => ({
      id: r.id,
      slug: r.slug,
      title_th: r.title_th,
      title_en: r.title_en,
      body_th: r.body_th,
      body_en: r.body_en,
      excerpt: r.excerpt,
      cover_path: r.cover_path,
      publish_at: r.publish_at,
      tags: tagsMap[r.id] || []
    }));

    res.json({
      ok: true,
      items,
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit))
    });
  } catch (e) {
    console.error('[posts/list] error:', e);
    res.status(500).json({ ok:false, error:'server_error' });
  } finally {
    conn.release();
  }
});


/**
 * GET /api/posts/get
 * Query:
 *  - lang=th|en  (default th)
 *  - id=:id      หรือ slug=:slug (อย่างใดอย่างหนึ่ง)
 *
 * Return: บทความเดี่ยว + แท็ก + แกลเลอรีรูป (post_images)
 */
app.get('/api/posts/get', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const lang = (req.query.lang || 'th').toLowerCase() === 'en' ? 'en' : 'th';
    const id   = parseInt(req.query.id || '0', 10) || 0;
    const slug = (req.query.slug || '').trim();

    if (!id && !slug) {
      return res.status(400).json({ ok:false, error:'missing_id_or_slug' });
    }

    const colTitle     = colI18n('title', lang);
    const colExcerpt   = colI18n('excerpt', lang);
    const colBody      = colI18n('body', lang);
    const colMetaTitle = colI18n('meta_title', lang);
    const colMetaDesc  = colI18n('meta_desc', lang);

    // อ่านบทความ (เฉพาะที่เผยแพร่และ active)
    let rows;
    if (id) {
      [rows] = await conn.query(
        `SELECT
           p.id, p.slug,
           ${colTitle}     AS title,
           ${colExcerpt}   AS excerpt,
           ${colBody}      AS content_html,
           p.cover_path, p.og_image_path,
           ${colMetaTitle} AS meta_title,
           ${colMetaDesc}  AS meta_desc,
           p.canonical_url,
           DATE_FORMAT(p.publish_at,'%Y-%m-%d') AS publish_at
         FROM posts p
        WHERE ${wherePublic()} AND p.id=? LIMIT 1`,
        [id]
      );
    } else {
      [rows] = await conn.query(
        `SELECT
           p.id, p.slug,
           ${colTitle}     AS title,
           ${colExcerpt}   AS excerpt,
           ${colBody}      AS content_html,
           p.cover_path, p.og_image_path,
           ${colMetaTitle} AS meta_title,
           ${colMetaDesc}  AS meta_desc,
           p.canonical_url,
           DATE_FORMAT(p.publish_at,'%Y-%m-%d') AS publish_at
         FROM posts p
        WHERE ${wherePublic()} AND p.slug=? LIMIT 1`,
        [slug]
      );
    }

    if (!rows.length) {
      return res.status(404).json({ ok:false, error:'not_found' });
    }

    const r = rows[0];

    // แท็กของโพสต์
    const [tagRows] = await conn.query(
      `SELECT tag FROM post_tags WHERE post_id=? ORDER BY tag`,
      [r.id]
    );
    const tags = tagRows.map(t => t.tag);

    // แกลเลอรีรูปภาพ (เรียงตาม sort_order, id)
    const [imgRows] = await conn.query(
      `SELECT id, file_path, sort_order
         FROM post_images
        WHERE post_id=?
        ORDER BY sort_order ASC, id ASC`,
      [r.id]
    );

    res.json({
      ok: true,
      item: {
        id: r.id,
        slug: r.slug,
        title: r.title,
        excerpt: r.excerpt,
        content_html: r.content_html,  // แนะนำ sanitize ตอนเขียน/บันทึก
        cover_path: r.cover_path,
        og_image_path: r.og_image_path,
        publish_at: r.publish_at,
        meta: {
          title: r.meta_title || r.title,     // fallback
          description: r.meta_desc || r.excerpt || '',
          canonical_url: r.canonical_url || null
        },
        tags,
        images: imgRows.map(im => ({
          id: im.id,
          file_path: im.file_path,
          sort_order: im.sort_order|0
        }))
      }
    });
  } catch (e) {
    console.error('[posts/get] error:', e);
    res.status(500).json({ ok:false, error:'server_error' });
  } finally {
    conn.release();
  }
});

// ===== DELETE ROOM IMAGE (ทีละรูป) =====
app.delete('/api/admin/rooms/:roomId/images/:imageId', auth, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const roomId  = Number(req.params.roomId);
    const imageId = Number(req.params.imageId);
    if (!roomId || !imageId) {
      return res.status(400).json({ ok:false, error:'missing_ids' });
    }

    // ดึง path ไฟล์ก่อน
    const [rows] = await conn.query(
      'SELECT file_path FROM room_images WHERE id=? AND room_id=? LIMIT 1',
      [imageId, roomId]
    );
    if (!rows.length) {
      return res.status(404).json({ ok:false, error:'not_found' });
    }
    const filePath = rows[0].file_path;

    await conn.beginTransaction();
    await conn.execute(
      'DELETE FROM room_images WHERE id=? AND room_id=?',
      [imageId, roomId]
    );
    await conn.commit();

    // ลบไฟล์บนดิสก์
    if (filePath) {
      try {
        const rel = filePath.replace(PUBLIC_BASE, '').replace(/^\/+/, '');
        const full = path.join(UPLOAD_ROOT, rel);
        if (fs.existsSync(full)) {
          fs.unlinkSync(full);
        }
      } catch (e) {
        console.warn('[rooms image delete] cannot unlink file:', e);
      }
    }

    res.json({ ok:true });
  } catch (e) {
    try { await conn.rollback(); } catch {}
    console.error('[rooms image delete] error:', e);
    res.status(500).json({ ok:false, error:'server_error' });
  } finally {
    conn.release();
  }
});

// ===== UPDATE ROOM (แก้ไขข้อมูล + ลบ/เพิ่มรูปได้) =====
app.post('/api/rooms_update.php', upload.array('images[]'), async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const id = Number(req.body.id);
    if (!id) {
      return res.status(400).json({ ok:false, error:'missing_id' });
    }

    const name_th        = (req.body.name_th || '').trim();
    const name_en        = (req.body.name_en || '').trim();
    const description_th = (req.body.description_th || '').trim();
    const description_en = (req.body.description_en || '').trim();

    if (!name_th) {
      return res.status(400).json({ ok:false, error:'name_th_required' });
    }

    // ids รูปที่ต้องการลบ  (มาจาก FormData: delete_ids = JSON.stringify([...]))
    let deleteIds = [];
    if (req.body.delete_ids) {
      try {
        deleteIds = JSON.parse(req.body.delete_ids);
        if (!Array.isArray(deleteIds)) deleteIds = [];
      } catch (e) {
        deleteIds = [];
      }
    }

    await conn.beginTransaction();

    // อัปเดตข้อมูลห้อง
    await conn.execute(
      `UPDATE rooms
         SET name=?,
             name_th=?,
             name_en=?,
             description=?,
             description_th=?,
             description_en=?
       WHERE id=?`,
      [
        name_th,
        name_th,
        name_en || null,
        description_th,
        description_th,
        description_en || null,
        id,
      ]
    );

    // ----- ลบรูปที่เลือก -----
    if (deleteIds.length) {
      // ดึง path เดิมมาเพื่อลบไฟล์ในดิสก์ด้วย
      const placeholders = deleteIds.map(() => '?').join(',');
      const [rows] = await conn.query(
        `SELECT id, file_path FROM room_images WHERE id IN (${placeholders}) AND room_id=?`,
        [...deleteIds, id]
      );

      await conn.query(
        `DELETE FROM room_images WHERE id IN (${placeholders}) AND room_id=?`,
        [...deleteIds, id]
      );

      // ลบไฟล์จริง (ถ้ามี)
      for (const r of rows) {
        if (!r.file_path) continue;
        // r.file_path เช่น /api/uploads/rooms/1/xxx.webp
        const rel = r.file_path.replace(PUBLIC_BASE + '/', '');
        const full = path.join(UPLOAD_ROOT, rel);
        if (fs.existsSync(full)) {
          fs.unlinkSync(full);
        }
      }
    }

    // ----- เพิ่มรูปใหม่ -----
    let baseOrder = 0;
    const [[{ maxOrder }]] = await conn.query(
      'SELECT COALESCE(MAX(sort_order), -1) AS maxOrder FROM room_images WHERE room_id=?',
      [id]
    );
    baseOrder = (maxOrder ?? -1) + 1;

    if (req.files && req.files.length) {
      const destDir = path.join(UPLOAD_ROOT, 'rooms', String(id));
      const saved = await saveManyOptimized(req.files, destDir);
      for (const s of saved) {
        const publicPath = `${PUBLIC_BASE}/rooms/${id}/${s.filename}`;
        await conn.execute(
          'INSERT INTO room_images (room_id, file_path, sort_order) VALUES (?,?,?)',
          [id, publicPath, baseOrder + s.sort_order]
        );
      }
    }

    await conn.commit();
    res.json({ ok:true });
  } catch (e) {
    await conn.rollback();
    console.error('[rooms_update] error:', e);
    res.status(500).json({ ok:false, error:'server_error', detail:String(e.message||e) });
  } finally {
    conn.release();
  }
});

// UPDATE facility: แก้ชื่อ/รายละเอียด + ลบ/เพิ่มรูปได้
app.post('/api/facilities/update.php', upload.array('images[]'), async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const id = Number(req.body.id);
    if (!id) {
      return res.status(400).json({ ok:false, error:'missing_id' });
    }

    const category       = (req.body.category || '').trim() || null;
    const title_th       = (req.body.title_th || '').trim();
    const title_en       = (req.body.title_en || '').trim();
    const description_th = (req.body.description_th || '').trim();
    const description_en = (req.body.description_en || '').trim();

    if (!title_th) {
      return res.status(400).json({ ok:false, error:'title_required' });
    }

    // parse ids ที่จะลบรูปออก
    let deleteIds = [];
    if (req.body.delete_ids) {
      try {
        const tmp = JSON.parse(req.body.delete_ids);
        if (Array.isArray(tmp)) deleteIds = tmp.map(Number).filter(Boolean);
      } catch (e) {}
    }

    await conn.beginTransaction();

    // อัปเดตข้อมูลหลัก (title กลาง = title_th)
    await conn.execute(
      `UPDATE facilities
          SET category = COALESCE(?, category),
              title = ?,
              title_th = ?,
              title_en = ?,
              description = ?,
              description_th = ?,
              description_en = ?
        WHERE id=?`,
      [
        category,
        title_th,
        title_th,
        title_en || null,
        description_th,
        description_th,
        description_en || null,
        id
      ]
    );

    // ----- ลบรูปที่เลือก -----
    if (deleteIds.length) {
      const placeholders = deleteIds.map(()=>'?').join(',');
      const [rows] = await conn.query(
        `SELECT id, file_path
           FROM facility_images
          WHERE id IN (${placeholders}) AND facility_id=?`,
        [...deleteIds, id]
      );

      await conn.query(
        `DELETE FROM facility_images
          WHERE id IN (${placeholders}) AND facility_id=?`,
        [...deleteIds, id]
      );

      // ลบไฟล์จริง
      for (const r of rows) {
        if (!r.file_path) continue;
        const rel = r.file_path.replace(PUBLIC_BASE + '/', '');
        const full = path.join(UPLOAD_ROOT, rel);
        if (fs.existsSync(full)) fs.unlinkSync(full);
      }
    }

    // ----- เพิ่มรูปใหม่ -----
    const [[{ maxOrder }]] = await conn.query(
      'SELECT COALESCE(MAX(sort_order), -1) AS maxOrder FROM facility_images WHERE facility_id=?',
      [id]
    );
    let baseOrder = (maxOrder ?? -1) + 1;

    if (req.files && req.files.length) {
      const destDir = path.join(UPLOAD_ROOT, 'facilities', category || 'misc', String(id));
      const saved = await saveManyOptimized(req.files, destDir);
      for (const s of saved) {
        const publicPath = `${PUBLIC_BASE}/facilities/${category || 'misc'}/${id}/${s.filename}`;
        await conn.execute(
          'INSERT INTO facility_images (facility_id, file_path, sort_order) VALUES (?,?,?)',
          [id, publicPath, baseOrder + s.sort_order]
        );
      }
    }

    await conn.commit();
    res.json({ ok:true });
  } catch (e) {
    try { await conn.rollback(); } catch {}
    console.error('[facilities/update] error:', e);
    res.status(500).json({ ok:false, error:'server_error', detail:String(e.message||e) });
  } finally {
    conn.release();
  }
});


// ===== Google Places Reviews (public) =====
const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY || '';
const GOOGLE_PLACE_ID       = process.env.GOOGLE_PLACE_ID || '';

app.get('/api/reviews/google-places', async (req, res) => {
  try {
    if (!GOOGLE_PLACES_API_KEY || !GOOGLE_PLACE_ID) {
      return res.status(500).json({ ok: false, error: 'missing_google_config' });
    }

    const lang = (req.query.lang || 'th').toLowerCase() === 'en' ? 'en' : 'th';

    const url = new URL('https://maps.googleapis.com/maps/api/place/details/json');
    url.searchParams.set('place_id', GOOGLE_PLACE_ID);
    url.searchParams.set('fields', 'rating,user_ratings_total,reviews');
    url.searchParams.set('language', lang); // th หรือ en
    url.searchParams.set('key', GOOGLE_PLACES_API_KEY);

    const r = await fetch(url.toString());
    const data = await r.json();

    if (data.status !== 'OK') {
      console.error('[google-places] error:', data);
      return res.status(500).json({ ok: false, error: 'google_api_error', status: data.status });
    }

    const result = data.result || {};
    const reviews = (result.reviews || []).map(rv => ({
      author_name: rv.author_name,
      profile_photo_url: rv.profile_photo_url,
      rating: rv.rating,
      text: rv.text,
      relative_time: rv.relative_time_description,   // "เมื่อสัปดาห์ที่แล้ว"
      time: rv.time,                                  // unix timestamp
    }));

    res.json({
      ok: true,
      place: {
        name: result.name,
        rating: result.rating,
        total_ratings: result.user_ratings_total,
      },
      reviews,
    });
  } catch (e) {
    console.error('[google-places] exception:', e);
    res.status(500).json({ ok: false, error: 'server_error', detail: String(e.message || e) });
  }
});



/* ========================================================= */
app.listen(PORT, () => {
  console.log(`API running at http://localhost:${PORT}`)
  console.log(`Serving uploads at /uploads  (disk: ${UPLOAD_ROOT})`)
})

