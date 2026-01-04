/**
 * One-time seeding of products into Firestore using firebase-admin.
 *
 * Requirements:
 * - Create a Firebase service account key JSON.
 * - Set env GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/to/key.json
 * - Set env FIREBASE_PROJECT_ID=your-project-id
 *
 * Run:
 *   npm i
 *   npm run seed:products
 */

import admin from 'firebase-admin'
import crypto from 'node:crypto'

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

// --- Fixed categories (same as in data/categories.ts) ---
const CATEGORIES = {
  "Медикаменти": [
    "Антибіотики",
    "Ліки для вух, носа та горла",
    "Ліки від кашлю, застуди та грипу",
    "Ліки для нервової системи",
    "Кровоспинні препарати",
    "Засоби від алергії",
    "Засоби для догляду за очима",
    "Засоби для серцево-судинної системи",
    "Знеболювальні засоби",
    "Препарати для травлення",
    "Препарати для шкіри"
  ],
  "Вітаміни та БАДи": [
    "Мультивітаміни",
    "Мінерали",
    "Риб’ячий жир та Омега",
    "Вітаміни для дітей",
    "Вітаміни для серця та судин",
    "Вітаміни для очей",
    "Вітаміни для нервової системи",
    "Препарати для м’язів та суглобів",
    "Добавки для травлення",
    "Добавки для імунітету"
  ],
  "Краса та догляд": [
    "Аромакосметика",
    "Волосся та шкіра голови",
    "Декоративна косметика",
    "Догляд за обличчям",
    "Догляд за порожниною рота",
    "Догляд за тілом",
    "Захист від комах",
    "Захист від сонця"
  ],
  "Товари для дітей та мам": [
    "Засоби для купання та гігієни дитини",
    "Засоби догляду для здоров’я малюка",
    "Підгузки та пелюшки",
    "Дитяче харчування",
    "Товари для годування дітей"
  ],
  "Товари для здоров'я": [
    "Ароматерапія",
    "Замінники цукру",
    "Очищення води",
    "Товари для здорового харчування",
    "Товари для носа, вух та горла",
    "Товари для очей",
    "Фітотерапія"
  ],
  "Товари медичного призначення": [
    "Маніпуляційні засоби",
    "Перев’язувальні та фіксуючі матеріали",
    "Вироби медичного призначення",
    "Ортопедичні вироби та бандажі",
    "Догляд за хворими",
    "Товари для реабілітації",
    "Медична техніка",
    "Медичний одяг"
  ]
}

// --- Helpers ---
function slugify (s) {
  return s
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9а-яіїєґ]+/gi, '-')
    .replace(/^-+|-+$/g, '')
}

function randInt (min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function pick (arr) {
  return arr[randInt(0, arr.length - 1)]
}

function hash6 (s) {
  return crypto.createHash('md5').update(s).digest('hex').slice(0, 6)
}

// --- Product name generation pools (plausible, generic) ---
const MED_FORMS = ['таблетки', 'капсули', 'сироп', 'краплі', 'спрей', 'гель', 'мазь']
const MANUFACTURERS = [
  'PharmaCare',
  'BioHealth',
  'MedNova',
  'VitaLab',
  'HealthWay',
  'Dermaline',
  'CardioPlus',
  'NeuroLife'
]

const POOLS = [
  { key: 'антибіот', items: ['Амоксицилін', 'Азитроміцин', 'Цефуроксим', 'Доксициклін'] },
  { key: 'вух', items: ['Отокап', 'НазоСпрей', 'ГорлоФорт', 'СинусКлін'] },
  { key: 'кашл', items: ['Сироп від кашлю', 'Пастилки для горла', 'Порошок від застуди', 'Спрей для горла'] },
  { key: 'нерв', items: ['Магній B6', 'Гліцин', 'Екстракт валеріани', 'Мелатонін'] },
  { key: 'кров', items: ['Транексамова кислота', 'Вітамін K', 'Гемостатичні серветки', 'Гемостатичний порошок'] },
  { key: 'алер', items: ['Лоратадин', 'Цетиризин', 'Фексофенадин', 'Спрей від алергії'] },
  { key: 'оч', items: ['Зволожуючі краплі', 'Гель для очей', 'Розчин для лінз', 'Краплі для зняття втоми'] },
  { key: 'серцев', items: ['Коензим Q10', 'Калій + магній', 'Омега-3 комплекс', 'Екстракт глоду'] },
  { key: 'знебол', items: ['Ібупрофен', 'Парацетамол', 'Диклофенак', 'Напроксен'] },
  { key: 'травл', items: ['Ферментний комплекс', 'Пробіотик комплекс', 'Симетикон', 'Сорбент'] },
  { key: 'шкір', items: ['Пантенол', 'Крем від подразнення', 'Антисептичний гель', 'Мазь від висипу'] },

  { key: 'мультивіт', items: ['Мультивітаміни A-Z', 'Комплекс 12 вітамінів', 'Daily Multi', 'Вітамінний комплекс'] },
  { key: 'мінерал', items: ['Цинк', 'Селен', 'Магній', 'Кальцій'] },
  { key: 'омег', items: ['Омега-3', 'Риб’ячий жир', 'Омега 3-6-9', 'DHA/EPA комплекс'] },
  { key: 'дітей', items: ['Вітамін D3 для дітей', 'Жувальні вітаміни', 'Омега для дітей', 'Мультивітаміни для дітей'] },
  { key: 'суглоб', items: ['Глюкозамін', 'Хондроїтин', 'Колаген', 'MSM комплекс'] },
  { key: 'імун', items: ['Вітамін C 1000', 'Цинк + C', 'Ехінацея екстракт', 'Пробіотик для імунітету'] },

  { key: 'облич', items: ['Крем зволожуючий', 'Сироватка з вітаміном C', 'Гель для вмивання', 'Тонік заспокійливий'] },
  { key: 'тіл', items: ['Лосьйон для тіла', 'Крем для рук', 'Скраб', 'Гель для душу'] },
  { key: 'рот', items: ['Зубна паста', 'Ополіскувач', 'Нитка зубна', 'Гель для ясен'] },
  { key: 'волосс', items: ['Шампунь', 'Бальзам', 'Сироватка для волосся', 'Маска для волосся'] },
  { key: 'сонц', items: ['SPF 30 крем', 'SPF 50 крем', 'Спрей SPF', 'Після засмаги гель'] },
  { key: 'комах', items: ['Спрей репелент', 'Браслет від комах', 'Гель після укусів', 'Пластини від комарів'] },

  { key: 'підгуз', items: ['Підгузки', 'Пелюшки одноразові', 'Серветки дитячі', 'Крем під підгузок'] },
  { key: 'харч', items: ['Суміш молочна', 'Пюре фруктове', 'Каша дитяча', 'Печиво дитяче'] },
  { key: 'годуван', items: ['Пляшечка', 'Соска', 'Ніблер', 'Поїльник'] },
  { key: 'гігієн', items: ['Гель для купання', 'Шампунь дитячий', 'Пінка для ванни', 'Мило дитяче'] },

  { key: 'ароматерап', items: ['Ефірна олія лаванди', 'Ефірна олія евкаліпта', 'Аромадифузор', 'Олія чайного дерева'] },
  { key: 'цукр', items: ['Стевія', 'Еритритол', 'Ксиліт', 'Сироп без цукру'] },
  { key: 'вода', items: ['Фільтр-глечик', 'Картридж фільтра', 'Таблетки для очищення', 'Пляшка-фільтр'] },
  { key: 'фіто', items: ['Фіточай заспокійливий', 'Фіточай для травлення', 'Збір для імунітету', 'Трав’яний збір'] },

  { key: 'маніпуляц', items: ['Шприц 5 мл', 'Шприц 10 мл', 'Голки стерильні', 'Піпетки'] },
  { key: 'перев', items: ['Бинт еластичний', 'Пластир медичний', 'Марля стерильна', 'Серветки стерильні'] },
  { key: 'ортоп', items: ['Бандаж', 'Ортез', 'Устілки ортопедичні', 'Фіксатор суглоба'] },
  { key: 'реаб', items: ['Еспандер', 'Масажний ролик', 'М’яч для реабілітації', 'Гумова стрічка'] },
  { key: 'технік', items: ['Термометр', 'Тонометр', 'Інгалятор', 'Глюкометр'] },
  { key: 'одяг', items: ['Халат медичний', 'Шапочка', 'Маска медична', 'Рукавички нітрилові'] }
]

function poolFor(child) {
  const s = child.toLowerCase()
  for (const p of POOLS) {
    if (s.includes(p.key)) return p.items
  }
  // fallback
  return ['Комплекс', 'Засіб', 'Продукт', 'Набір']
}

function makeFourProducts(parent, child) {
  const baseItems = poolFor(child)
  const products = []
  for (let i = 0; i < 4; i++) {
    const base = baseItems[i % baseItems.length]
    const form = parent === 'Медикаменти' ? pick(MED_FORMS) : 'упаковка'
    const dose = parent === 'Медикаменти'
      ? pick(['250 мг', '500 мг', '100 мг', '20 мг'])
      : pick(['60 капсул', '30 капсул', '100 мл', '20 шт'])

    const name = parent === 'Медикаменти'
      ? `${base} ${dose} ${form}`
      : `${base} • ${dose}`

    const manufacturer = pick(MANUFACTURERS)
    const price = parent === 'Товари медичного призначення'
      ? randInt(90, 900)
      : randInt(60, 600)

    const slug = slugify(`${parent}-${child}-${name}-${hash6(name + child + i)}`)
    const imagePath = `products/${slug}.jpg`

    products.push({
      name,
      parentCategory: parent,
      childCategory: child,
      manufacturer,
      description: `Категорія: ${child}. Опис довільний (демо для дипломного проєкту).`,
      price,
      imageUrl: '',
      imagePath
    })
  }
  return products
}

async function main () {
  console.log('Seeding products...')

  // optional: clear existing products
  const existing = await db.collection('products').limit(1).get()
  if (!existing.empty) {
    console.log('WARNING: products collection is not empty. We will append new products.')
  }

  const all = []
  for (const [parent, children] of Object.entries(CATEGORIES)) {
    for (const child of children) {
      all.push(...makeFourProducts(parent, child))
    }
  }

  console.log(`Prepared ${all.length} products.`)

  // Write in batches (max 500 ops/batch)
  let batch = db.batch()
  let count = 0
  let written = 0

  for (const p of all) {
    const ref = db.collection('products').doc()
    batch.set(ref, p)
    count++

    if (count === 450) { // keep margin
      await batch.commit()
      written += count
      console.log(`Committed ${written}...`)
      batch = db.batch()
      count = 0
    }
  }

  if (count > 0) {
    await batch.commit()
    written += count
  }

  console.log(`DONE. Written: ${written}`)
  console.log('Next step: upload images to Storage with paths from imagePath (products/*.jpg).')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
