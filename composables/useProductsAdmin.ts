import { getFirestore, collection, getDocs, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore'
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import { useFirebaseApp } from '~/composables/useFirebaseApp'

export function useProductsAdmin () {
  const app = useFirebaseApp()
  const db = getFirestore(app)
  const storage = getStorage(app)

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
    const path = `products/${Date.now()}_${file.name}`
    const ref = storageRef(storage, path)
    await uploadBytes(ref, file)
    const downloadURL = await getDownloadURL(ref)
    return { downloadURL }
  }

  return {
    list,
    createOne,
    updateOne,
    removeOne,
    uploadImageToStorage
  }
}
