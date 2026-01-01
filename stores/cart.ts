import { defineStore } from 'pinia'

export type CartItem = {
  productId: string
  name: string
  price: number
  qty: number
  imageUrl?: string
}

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: [] as CartItem[]
  }),
  getters: {
    totalQty: (s) => s.items.reduce((sum, it) => sum + it.qty, 0),
    total: (s) => s.items.reduce((sum, it) => sum + it.qty * it.price, 0)
  },
  actions: {
    hydrateFromStorage () {
      if (process.server) return
      const raw = localStorage.getItem('cart')
      if (!raw) return
      try { this.items = JSON.parse(raw) } catch {}
    },
    persist () {
      if (process.server) return
      localStorage.setItem('cart', JSON.stringify(this.items))
    },
    add (item: Omit<CartItem, 'qty'>, qty = 1) {
      const existing = this.items.find(i => i.productId === item.productId)
      if (existing) existing.qty += qty
      else this.items.push({ ...item, qty })
      this.persist()
    },
    setQty (productId: string, qty: number) {
      const it = this.items.find(i => i.productId === productId)
      if (!it) return
      it.qty = Math.max(1, qty)
      this.persist()
    },
    remove (productId: string) {
      this.items = this.items.filter(i => i.productId !== productId)
      this.persist()
    },
    clear () {
      this.items = []
      this.persist()
    }
  }
})
