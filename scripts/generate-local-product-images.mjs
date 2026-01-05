/**
 * Generate local demo SVG images for all products in Firestore.
 * Output: public/products/<slug>.svg
 *
 * Needs:
 *   GOOGLE_APPLICATION_CREDENTIALS = path to service account json
 *   FIREBASE_PROJECT_ID = your firebase project id
 *
 * Run:
 *   npm i
 *   npm run gen:images
 */

import admin from 'firebase-admin'
import fs from 'node:fs'
import path from 'node:path'

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
const outDir = path.resolve('public', 'products')
fs.mkdirSync(outDir, { recursive: true })

function escapeXml(s='') {
  return String(s)
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'",'&apos;')
}

function wrapText(str, maxLen=28) {
  const words = String(str).split(' ')
  const lines = []
  let line = ''
  for (const w of words) {
    const test = (line ? line + ' ' : '') + w
    if (test.length > maxLen) {
      if (line) lines.push(line)
      line = w
    } else {
      line = test
    }
  }
  if (line) lines.push(line)
  return lines.slice(0, 3) // max 3 lines
}

function svgTemplate({ title, subtitle, price, tag }) {
  const tLines = wrapText(title, 26)
  const sLines = wrapText(subtitle, 34)

  const tY = 86
  const tStep = 34

  const titleTspans = tLines.map((l, i) =>
    `<tspan x="40" y="${tY + i*tStep}">${escapeXml(l)}</tspan>`
  ).join('')

  const subStartY = 210
  const subStep = 26
  const subTspans = sLines.map((l, i) =>
    `<tspan x="40" y="${subStartY + i*subStep}">${escapeXml(l)}</tspan>`
  ).join('')

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
  <defs>
    <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0%" stop-color="#ecfdf5"/>
      <stop offset="100%" stop-color="#f0f9ff"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="10" stdDeviation="12" flood-opacity="0.12"/>
    </filter>
  </defs>

  <rect x="0" y="0" width="800" height="800" fill="url(#g)"/>
  <rect x="48" y="48" width="704" height="704" rx="42" fill="#ffffff" filter="url(#shadow)"/>

  <rect x="80" y="80" width="640" height="96" rx="28" fill="#ecfdf5" stroke="#a7f3d0"/>
  <text x="110" y="142" font-family="Inter, Arial, sans-serif" font-size="34" font-weight="700" fill="#065f46">
    ${escapeXml(tag)}
  </text>

  <text font-family="Inter, Arial, sans-serif" font-size="44" font-weight="800" fill="#111827">
    ${titleTspans}
  </text>

  <text font-family="Inter, Arial, sans-serif" font-size="24" font-weight="500" fill="#374151">
    ${subTspans}
  </text>

  <rect x="80" y="620" width="640" height="96" rx="28" fill="#f9fafb" stroke="#e5e7eb"/>
  <text x="110" y="682" font-family="Inter, Arial, sans-serif" font-size="30" font-weight="700" fill="#111827">
    ${escapeXml(price)}
  </text>

  <text x="690" y="682" text-anchor="end" font-family="Inter, Arial, sans-serif" font-size="18" fill="#6b7280">
    demo image
  </text>
</svg>`
}

function slugFromImagePath(imagePath) {
  // expected: products/<slug>.jpg
  if (!imagePath) return null
  const m = /^products\/(.+)\.jpg$/.exec(imagePath)
  return m ? m[1] : null
}

async function main() {
  console.log('Generating local demo images from Firestore products...')
  const snap = await db.collection('products').get()
  console.log(`Found ${snap.size} products.`)

  let n = 0
  for (const doc of snap.docs) {
    const p = doc.data()
    const slug = slugFromImagePath(p.imagePath)
    if (!slug) continue

    const file = path.join(outDir, `${slug}.svg`)
    const svg = svgTemplate({
      title: p.name || 'Товар',
      subtitle: `${p.parentCategory || ''} / ${p.childCategory || ''}`,
      price: `${Number(p.price || 0).toFixed(2)} грн`,
      tag: 'Аптека • Самовивіз'
    })
    fs.writeFileSync(file, svg, 'utf8')
    n++
  }

  console.log(`DONE. Generated ${n} SVG images in public/products/`)
  console.log('UI will show them as fallback when imageUrl is empty.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
