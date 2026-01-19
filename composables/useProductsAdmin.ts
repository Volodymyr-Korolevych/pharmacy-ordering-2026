import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore'
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'

export function useProductsAdmin () {
  const nuxtApp = useNuxtApp()

  const fb = (nuxtApp as any).$firebase
  if (!fb?.app || !fb?.db) {
    throw new Error('Firebase is not initialized. Check plugins/firebase.client.ts and NUXT_PUBLIC_FIREBASE_* env vars.')
  }

  const db = fb.db
  const storage = getStorage(fb.app)

  const col = collection(db, 'products')

  async function list () {
    const snap = await getDocs(col)
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
  }

  async function createOne (data: any) {
    await addDoc(col, data)
  }

  async function updateOne (id: string, data: any) {
    const ref = doc(db, 'products', id)
    await updateDoc(ref, data)
  }

  async function removeOne (id: string) {
    const ref = doc(db, 'products', id)
    await deleteDoc(ref)
  }

  async function uploadImageToStorage (file: File) {
    // можна буде потім замінити на більш красивий slug
    const safeName = String(file.name || 'image').replace(/\s+/g, '_')
    const path = `products/${Date.now()}_${safeName}`
    const ref = storageRef(storage, path)
    await uploadBytes(ref, file)
    const downloadURL = await getDownloadURL(ref)
    return { downloadURL, path }
  }

  return {
    list,
    createOne,
    updateOne,
    removeOne,
    uploadImageToStorage
  }
}
