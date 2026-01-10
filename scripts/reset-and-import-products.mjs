/**
 * TASK005: Reset products and import from Excel with new schema.
 *
 * IMPORTANT:
 * - Place the Excel file at: scripts/medicinelist_new.xlsx
 *
 * ENV:
 *   GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/serviceAccountKey.json
 *   FIREBASE_PROJECT_ID=your-project-id
 *
 * Run:
 *   npm i
 *   npm run products:reset-import
 */

import admin from 'firebase-admin'
import path from 'node:path'
import fs from 'node:fs'
import xlsx from 'xlsx'

const projectId = process.env.FIREBASE_PROJECT_ID
if (!projectId) {
  console.error('Missing env FIREBASE_PROJECT_ID')
  process.exit(1)
}

if (!admin.apps.length) {

  const keyPath = process.env.SERVICE_ACCOUNT_JSON || process.env.GOOGLE_APPLICATION_CREDENTIALS
  if (!keyPath) {
    console.error('Missing SERVICE_ACCOUNT_JSON or GOOGLE_APPLICATION_CREDENTIALS')
    process.exit(1)
  }
  const serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'))
  console.log(`Using service account key from: ${keyPath}`, serviceAccount)

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  })
}

const db = admin.firestore()

function normalizeImagePath(imagePath) {
  // Excel може містити "002.webp" або "images/002.webp"
  const s = String(imagePath || '').trim().replace(/\\/g, '/')
  if (!s) return ''
  if (s.includes('/')) return s.startsWith('images/') ? s : s.replace(/^\/+/, '')
  return `images/${s}`
}

function docIdFromImagePath(imagePath) {
  const s = normalizeImagePath(imagePath)
  const base = s.split('/').pop() || ''
  const id = base.replace(/\.[a-z0-9]+$/i, '')
  return id || null
}

function readExcelRows() {
  const filePath = path.resolve('scripts', 'medicinelist_new.xlsx')
  if (!fs.existsSync(filePath)) {
    console.error(`Excel file not found: ${filePath}`)
    console.error('Put your file here: scripts/medicinelist_new.xlsx')
    process.exit(1)
  }

  const wb = xlsx.readFile(filePath, { cellDates: false })
  const sheetName = wb.SheetNames[0]
  const ws = wb.Sheets[sheetName]

  // defval щоб порожні були '' а не undefined
  const rows = xlsx.utils.sheet_to_json(ws, { defval: '' })
  return rows
}

async function deleteAllProducts() {
  const col = db.collection('products')
  let total = 0
  while (true) {
    const snap = await col.limit(450).get()
    if (snap.empty) break

    const batch = db.batch()
    snap.docs.forEach(d => batch.delete(d.ref))
    await batch.commit()

    total += snap.size
    console.log(`Deleted ${total}...`)
  }
  console.log(`DONE deleting. Total deleted: ${total}`)
}

async function importProducts(rows) {
  const col = db.collection('products')
  let written = 0
  let batch = db.batch()
  let ops = 0

  for (const r of rows) {
    const id = docIdFromImagePath(r.imagePath)
    if (!id) continue

    const imagePath = normalizeImagePath(r.imagePath)

    // NEW SCHEMA
    const doc = {
      name: String(r.name || ''),
      unit: String(r.unit || ''),
      imagePath,                 // local starter image: /public/images/<file>
      imageUrl: String(r.imageUrl || ''), // admin Storage URL (empty for стартових)
      parentCategory: String(r.parentCategory || ''),
      childCategory: String(r.childCategory || ''),
      manufacturer: String(r.manufacturer || ''),
      price: Number(r.price || 0),
      description: {
        composition: String(r['Склад'] || ''),
        dosageForm: String(r['Лікарська форма'] || ''),
        pharmacotherapeuticGroup: String(r['Фармакотерапевтична група'] || ''),
        pharmacologicalProperties: String(r['Фармакологічні властивості'] || ''),
        indications: String(r['Показання'] || ''),
        contraindications: String(r['Протипоказання'] || ''),
        dosageAndAdministration: String(r['Спосіб застосування та дози'] || ''),
        shelfLife: String(r['Термін придатності'] || ''),
        storageConditions: String(r['Умови зберігання'] || ''),
        packaging: String(r['Упаковка'] || ''),
        manufacturerInfo: String(r['Виробник'] || '')
      }
    }

    const ref = col.doc(String(id))
    batch.set(ref, doc)
    ops++

    if (ops >= 450) {
      await batch.commit()
      written += ops
      console.log(`Imported ${written}...`)
      batch = db.batch()
      ops = 0
    }
  }

  if (ops > 0) {
    await batch.commit()
    written += ops
  }

  console.log(`DONE importing. Total imported: ${written}`)
}

async function main() {
  console.log('TASK005: reset products and import from Excel...')
  const rows = readExcelRows()
  console.log(`Excel rows: ${rows.length}`)

  await deleteAllProducts()
  await importProducts(rows)

  console.log('OK. Ensure starter images exist in /public/images/.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
