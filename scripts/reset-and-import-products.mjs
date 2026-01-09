/**
 * TASK005: Reset and import products into Firestore with new schema.
 *
 * Requirements:
 * - Service account json
 * - env:
 *   GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/serviceAccountKey.json
 *   FIREBASE_PROJECT_ID=your-project-id
 *
 * Run:
 *   npm i
 *   npm run products:reset-import
 */
import admin from 'firebase-admin'
import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'

const projectId = process.env.FIREBASE_PROJECT_ID
if (!projectId) {
  console.error('Missing env FIREBASE_PROJECT_ID')
  process.exit(1)
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId
  })
}

const db = admin.firestore()

function decodeSeedData() {
  const b64Path = path.resolve('scripts', 'products-seed-data.b64')
  const b64 = fs.readFileSync(b64Path, 'utf8').replace(/\s+/g, '')
  const gz = Buffer.from(b64, 'base64')
  const jsonText = zlib.gunzipSync(gz).toString('utf8')
  return JSON.parse(jsonText)
}

function idFromImagePath(imagePath) {
  // imagePath expected like: images/002.webp
  const s = String(imagePath || '').replace(/\\/g, '/')
  const base = s.split('/').pop() || ''
  const id = base.replace(/\.[a-z0-9]+$/i, '')
  return id || null
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

async function importProducts(products) {
  const col = db.collection('products')
  let written = 0
  let batch = db.batch()
  let ops = 0

  for (const p of products) {
    const id = idFromImagePath(p.imagePath)
    if (!id) continue

    // new schema (+ imageUrl field for Storage images)
    const doc = {
      name: p.name || '',
      unit: p.unit || '',
      imagePath: p.imagePath || '',     // local: /public/images/<file>
      imageUrl: p.imageUrl || '',       // storage download URL (admin-added/edited)
      parentCategory: p.parentCategory || '',
      childCategory: p.childCategory || '',
      manufacturer: p.manufacturer || '',
      price: Number.isFinite(p.price) ? p.price : Number(p.price || 0),
      description: {
        composition: p.description?.composition || '',
        dosageForm: p.description?.dosageForm || '',
        pharmacotherapeuticGroup: p.description?.pharmacotherapeuticGroup || '',
        pharmacologicalProperties: p.description?.pharmacologicalProperties || '',
        indications: p.description?.indications || '',
        contraindications: p.description?.contraindications || '',
        dosageAndAdministration: p.description?.dosageAndAdministration || '',
        shelfLife: p.description?.shelfLife || '',
        storageConditions: p.description?.storageConditions || '',
        packaging: p.description?.packaging || '',
        manufacturerInfo: p.description?.manufacturerInfo || ''
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
  console.log('TASK005: reset products and import new data...')
  const products = decodeSeedData()
  console.log(`Seed rows: ${products.length}`)

  await deleteAllProducts()
  await importProducts(products)

  console.log('OK. Next: ensure /public/images has the referenced files.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
