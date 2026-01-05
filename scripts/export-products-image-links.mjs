/**
 * Export CSV: products -> Wikimedia Commons image link candidates.
 *
 * Reads products from Firestore and queries Wikimedia Commons API to find an image.
 *
 * ENV (PowerShell):
 *   $env:GOOGLE_APPLICATION_CREDENTIALS="C:\path\serviceAccountKey.json"
 *   $env:FIREBASE_PROJECT_ID="your-project-id"
 *
 * Run:
 *   npm i
 *   node scripts/export-products-image-links.mjs
 *
 * Output:
 *   ./product_images.csv
 */

import admin from 'firebase-admin'
import fs from 'node:fs'

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

// --- Wikimedia Commons API helper ---
async function commonsSearchFirstImage(query) {
  // We search within file namespace and prefer jpg/png.
  const url = new URL('https://commons.wikimedia.org/w/api.php')
  url.searchParams.set('action', 'query')
  url.searchParams.set('format', 'json')
  url.searchParams.set('origin', '*')
  url.searchParams.set('generator', 'search')
  url.searchParams.set('gsrsearch', `intitle:${query} OR ${query} filetype:bitmap`)
  url.searchParams.set('gsrlimit', '1')
  url.searchParams.set('gsrnamespace', '6') // File:
  url.searchParams.set('prop', 'imageinfo')
  url.searchParams.set('iiprop', 'url|extmetadata')
  url.searchParams.set('iiurlwidth', '800')

  const res = await fetch(url.toString())
  if (!res.ok) return null
  const json = await res.json()

  const pages = json?.query?.pages
  if (!pages) return null

  const page = Object.values(pages)[0]
  const title = page?.title // "File:...."
  const info = page?.imageinfo?.[0]
  if (!title || !info?.url) return null

  // Direct file URL (original)
  const directUrl = info.url
  // Preview-sized if you want
  const thumbUrl = info.thumburl || ''

  // Commons file page
  const filePage = `https://commons.wikimedia.org/wiki/${encodeURIComponent(title)}`

  // License info (best effort)
  const licenseShort = info?.extmetadata?.LicenseShortName?.value || ''
  const artist = info?.extmetadata?.Artist?.value || ''

  return {
    title,
    directUrl,
    thumbUrl,
    filePage,
    licenseShort,
    artist
  }
}

function csvEscape(v) {
  const s = String(v ?? '')
  if (/[,"\n]/.test(s)) return `"${s.replaceAll('"','""')}"`
  return s
}

async function main() {
  console.log('Reading products from Firestore...')
  const snap = await db.collection('products').get()
  console.log(`Found ${snap.size} products.`)

  const rows = []
  rows.push([
    'productId',
    'name',
    'parentCategory',
    'childCategory',
    'manufacturer',
    'price',
    'image_direct_url',
    'image_thumb_url',
    'commons_file_page',
    'license',
    'artist'
  ])

  let i = 0
  for (const doc of snap.docs) {
    i++
    const p = doc.data()

    // Query strategy: try name first; then name without dosage; then child category
    const q1 = `${p.name}`.trim()
    const q2 = `${p.name}`.replace(/\b\d+\s?(мг|ml|мл|шт|капсул)\b/gi, '').trim()
    const q3 = `${p.childCategory}`.trim()

    let hit = await commonsSearchFirstImage(q1)
    if (!hit && q2 && q2 !== q1) hit = await commonsSearchFirstImage(q2)
    if (!hit && q3) hit = await commonsSearchFirstImage(q3)

    rows.push([
      doc.id,
      p.name || '',
      p.parentCategory || '',
      p.childCategory || '',
      p.manufacturer || '',
      p.price ?? '',
      hit?.directUrl || '',
      hit?.thumbUrl || '',
      hit?.filePage || '',
      hit?.licenseShort || '',
      hit?.artist || ''
    ])

    if (i % 25 === 0) console.log(`Processed ${i}/${snap.size}...`)
    // polite delay to avoid rate-limit
    await new Promise(r => setTimeout(r, 120))
  }

  const csv = rows.map(r => r.map(csvEscape).join(',')).join('\n')
  fs.writeFileSync('product_images.csv', csv, 'utf8')
  console.log('DONE: product_images.csv created.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
