import { collection, addDoc, deleteDoc, doc, getDocs, orderBy, query, updateDoc } from 'firebase/firestore'
import type { DocumentData } from 'firebase/firestore'

export type Product = {
  id?: string
  name: string
  parentCategory: string
  childCategory: string
  manufacturer: string
  description: string
  price: number
  imageUrl: string
}

function assertFirebaseDb () {
  const { $firebase } = useNuxtApp()
  if (!$firebase?.db) throw new Error('Firebase is not configured (db missing).')
  return $firebase.db
}

export function useProducts () {
  const products = useState<Product[]>('products', () => [])
  const loading = useState<boolean>('productsLoading', () => false)

  async function fetchAll () {
    const db = assertFirebaseDb()
    loading.value = true
    try {
      const q = query(collection(db, 'products'), orderBy('name', 'asc'))
      const snap = await getDocs(q)
      products.value = snap.docs.map(d => ({ id: d.id, ...(d.data() as DocumentData) })) as Product[]
    } finally {
      loading.value = false
    }
  }

  async function create (p: Product) {
    const db = assertFirebaseDb()
    const ref = await addDoc(collection(db, 'products'), p)
    return ref.id
  }

  async function update (id: string, patch: Partial<Product>) {
    const db = assertFirebaseDb()
    await updateDoc(doc(db, 'products', id), patch as any)
  }

  async function remove (id: string) {
    const db = assertFirebaseDb()
    await deleteDoc(doc(db, 'products', id))
  }

  return { products, loading, fetchAll, create, update, remove }
}
