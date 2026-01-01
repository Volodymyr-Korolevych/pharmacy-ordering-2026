import { addDoc, collection, doc, getDoc, getDocs, orderBy, query, updateDoc, where } from 'firebase/firestore'
import type { DocumentData } from 'firebase/firestore'

export type OrderStatus = 'new' | 'issued' | 'canceled'

export type OrderItem = {
  productId: string
  name: string
  price: number
  qty: number
}

export type Order = {
  id?: string
  userId: string
  pharmacyCode: string
  items: OrderItem[]
  total: number
  status: OrderStatus
  createdAt: number
}

function assertFirebaseDb () {
  const { $firebase } = useNuxtApp()
  if (!$firebase?.db) throw new Error('Firebase is not configured (db missing).')
  return $firebase.db
}

export function useOrders () {
  const loading = useState<boolean>('ordersLoading', () => false)

  async function create (o: Omit<Order, 'id'>) {
    const db = assertFirebaseDb()
    const ref = await addDoc(collection(db, 'orders'), o)
    return ref.id
  }

  async function getById (id: string) {
    const db = assertFirebaseDb()
    const snap = await getDoc(doc(db, 'orders', id))
    if (!snap.exists()) return null
    return { id: snap.id, ...(snap.data() as DocumentData) } as Order
  }

  async function listForUser (userId: string) {
    const db = assertFirebaseDb()
    loading.value = true
    try {
      const q = query(
        collection(db, 'orders'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      )
      const snap = await getDocs(q)
      return snap.docs.map(d => ({ id: d.id, ...(d.data() as DocumentData) })) as Order[]
    } finally {
      loading.value = false
    }
  }

  async function listForPharmacy (pharmacyCode: string) {
    const db = assertFirebaseDb()
    loading.value = true
    try {
      const q = query(
        collection(db, 'orders'),
        where('pharmacyCode', '==', pharmacyCode),
        orderBy('createdAt', 'desc')
      )
      const snap = await getDocs(q)
      return snap.docs.map(d => ({ id: d.id, ...(d.data() as DocumentData) })) as Order[]
    } finally {
      loading.value = false
    }
  }

  async function setStatus (id: string, status: OrderStatus) {
    const db = assertFirebaseDb()
    await updateDoc(doc(db, 'orders', id), { status })
  }

  return { loading, create, getById, listForUser, listForPharmacy, setStatus }
}
