export type Pharmacy = { code: string; name: string; address: string; phone: string }

export const PHARMACIES: Pharmacy[] = Array.from({ length: 10 }).map((_, i) => {
  const idx = String(i + 1).padStart(3, '0')
  return {
    code: `apotheke${idx}`,
    name: `Аптека №${i + 1}`,
    address: `м. Львів, вул. Прикладна, ${i + 1}`,
    phone: `+380 (32) 000-00-${String(i + 1).padStart(2, '0')}`
  }
})
