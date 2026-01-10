import { defineEventHandler, readMultipartFormData, getCookie, createError } from 'h3'
import crypto from 'node:crypto'
import { getAdminApp } from '~/server/utils/firebaseAdmin'
import admin from 'firebase-admin'

function isAdminFromCookie(event: any): boolean {
  const raw = getCookie(event, 'fixed_session')
  if (!raw) return false

  // Nuxt useCookie(object) stores JSON in cookie. On server it's a string.
  try {
    const parsed = JSON.parse(raw)
    return parsed?.kind === 'admin'
  } catch {
    // sometimes cookie may be double-encoded
    try {
      const parsed = JSON.parse(decodeURIComponent(raw))
      return parsed?.kind === 'admin'
    } catch {
      return false
    }
  }
}

export default defineEventHandler(async (event) => {
  if (!isAdminFromCookie(event)) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const form = await readMultipartFormData(event)
  if (!form) throw createError({ statusCode: 400, statusMessage: 'No form data' })

  const file = form.find((p) => p.name === 'file')
  if (!file || !('data' in file) || !file.data) {
    throw createError({ statusCode: 400, statusMessage: 'Missing file' })
  }

  const original = String((file as any).filename || 'image')
  const ext = (original.includes('.') ? original.split('.').pop() : 'jpg')?.toLowerCase() || 'jpg'
  const safeExt = ['jpg','said','jpeg','png','webp'].includes(ext) ? ext : 'jpg'

  const productId = String((form.find(p => p.name === 'productId') as any)?.data?.toString?.() || '').trim()
  const baseName = productId ? `products/${productId}` : `products/${Date.now()}_${crypto.randomBytes(3).toString('hex')}`
  const filePath = `${baseName}.${safeExt}`

  // init admin
  getAdminApp()
  const bucket = admin.storage().bucket()

  // token for Firebase download URL
  const token = crypto.randomUUID()

  const contentType =
    safeExt === 'png' ? 'image/png'
    : safeExt === 'webp' ? 'image/webp'
    : 'image/jpeg'

  const f = bucket.file(filePath)
  await f.save(file.data, {
    resumable: false,
    metadata: {
      contentType,
      metadata: {
        firebaseStorageDownloadTokens: token
      }
    }
  })

  const bucketName = bucket.name
  const downloadURL =
    `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(filePath)}?alt=media&token=${token}`

  return {
    ok: true,
    filePath,
    downloadURL
  }
})
