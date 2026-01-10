import admin from 'firebase-admin'
import fs from 'node:fs'

let _app: admin.app.App | null = null

function readServiceAccountFromEnv() {
  const json = process.env.FIREBASE_ADMIN_CREDENTIALS_JSON
  if (json && json.trim().startsWith('{')) {
    return JSON.parse(json)
  }

  const path = process.env.GOOGLE_APPLICATION_CREDENTIALS
  if (path && fs.existsSync(path)) {
    return JSON.parse(fs.readFileSync(path, 'utf8'))
  }

  return null
}

export function getAdminApp() {
  if (_app) return _app

  const serviceAccount = readServiceAccountFromEnv()
  if (!serviceAccount) {
    throw new Error(
      'Missing Firebase Admin credentials. Set FIREBASE_ADMIN_CREDENTIALS_JSON (recommended) or GOOGLE_APPLICATION_CREDENTIALS.'
    )
  }

  const storageBucket = process.env.FIREBASE_STORAGE_BUCKET
  if (!storageBucket) {
    throw new Error('Missing FIREBASE_STORAGE_BUCKET (e.g. your-project-id.appspot.com)')
  }

  _app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as any),
    storageBucket
  })

  return _app
}
