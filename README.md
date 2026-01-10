# WEB-застосунок для онлайн-замовлення ліків (Nuxt 3 + Tailwind + Firebase)

**Ролі:**
- **Клієнт**: Firebase Auth (Email/Password). Без входу доступ заборонений.
- **Провізор**: фіксований логін `apotheke001..apotheke010` + спільний пароль з `.env`.
- **Адмін**: фіксований логін/пароль з `.env`.

**Обмеження, зафіксовані в ТЗ:**
- Тільки **самовивіз**.
- Оплата тільки **при отриманні**.
- Клієнту **не показуємо статус** замовлення (але провізор керує статусом: `new/issued/canceled`).
- Категорії **фіксовані**, 2 рівні (CRUD по категоріях НЕ використовується).
- Публічного доступу немає: будь-який маршрут → редірект на `/auth`.

## 1) Технології
- Nuxt 3 (Vue)
- Tailwind CSS
- Firebase Auth (Email/Password) для клієнтів
- Firestore (Firebase DB) для `products` та `orders`
- Pinia (кошик)

## 2) Структура даних (Firestore)
### `products`
```ts
{
  name: string,
  parentCategory: string,
  childCategory: string,
  manufacturer: string,
  description: string,
  price: number,
  imageUrl: string
}
```

### `orders`
```ts
{
  userId: string,
  pharmacyCode: string,     // apotheke001..apotheke010
  items: { productId, name, price, qty }[],
  total: number,
  status: "new"|"issued"|"canceled",
  createdAt: number
}
```

## 3) Підготовка Firebase (один раз)
1. Створи Firebase project (console.firebase.google.com).
2. Створи **Firestore Database** (режим test для швидкого старту або production).
3. У **Authentication → Sign-in method** увімкни **Email/Password**.
4. У **Project settings → Your apps** створи **Web App** та скопіюй Firebase config значення.

> Важливо: цей проєкт використовує Firebase Web SDK (client-side). Тому ключі з Firebase config зберігаються як `NUXT_PUBLIC_*`.

## 4) Налаштування локально (VSCode)
1. Розпакуй архів та відкрий папку в VSCode.
2. Скопіюй `.env.example` → `.env` та заповни значення:

```bash
cp .env.example .env
```

3. Встанови залежності та запусти dev:

```bash
npm install
npm run dev
```

Відкрий: `http://localhost:3000`

## 5) Логіни
- **Адмін**: `ADMIN_LOGIN` / `ADMIN_PASSWORD` з `.env`
- **Провізор**: логін `apotheke001` … `apotheke010`, пароль `PHARMACIST_PASSWORD`
- **Клієнт**: реєстрація/вхід через email+password (Firebase Auth)

## 6) Маршрути
- `/auth` — вхід/реєстрація
- **Клієнт:** `/catalog`, `/product/[id]`, `/cart`, `/checkout`, `/orders`, `/orders/[id]`
- **Провізор:** `/pharmacist/orders`, `/pharmacist/orders/[id]`
- **Адмін:** `/admin/products`, `/admin/pharmacies`

## 7) GitHub: ініціалізація репозиторію
```bash
git init
git add .
git commit -m "init: nuxt pharmacy ordering app"
git branch -M main
# створити репозиторій на GitHub, потім:
git remote add origin https://github.com/<YOUR_USERNAME>/<REPO_NAME>.git
git push -u origin main
```

## 8) Vercel: деплой
### Варіант A — через сайт Vercel
1. Імпортуй репозиторій з GitHub.
2. Framework: Nuxt.
3. Додай Environment Variables (такі ж, як в `.env`):
   - `NUXT_PUBLIC_FIREBASE_API_KEY`, ...
   - `ADMIN_LOGIN`, `ADMIN_PASSWORD`, `PHARMACIST_PASSWORD`
4. Deploy.

### Варіант B — через Vercel CLI
```bash
npm i -g vercel
vercel login
vercel
```
Далі додай env vars у Vercel (через UI або командою `vercel env add`).

## 9) Примітки для диплома
- Категорії зберігаються в коді: `data/categories.ts`
- Перелік аптек (10 штук) з кодами `apotheke001..010`: `data/pharmacies.ts`
- Кошик зберігається в `localStorage` (через Pinia store `stores/cart.ts`)

## 10) Типові проблеми
- Якщо бачиш `[firebase] Missing firebase config env vars` — не заповнені `NUXT_PUBLIC_FIREBASE_*` у `.env`.
- Якщо Firestore в production-режимі й правила забороняють читання/запис — тимчасово увімкни test-режим або налаштуй правила під диплом.

---
**Далі ми будемо робити зміни як `TASK00x` у вигляді YAML для `.github/workflows` з повним перезаписом файлів.**

---

## Seeding товарів у Firestore (одноразово)

Цей проєкт має скрипт, який **згенерує товари для всіх підкатегорій** (4 шт. на кожну) і запише у колекцію `products`.

### 1) Створи Service Account Key (для Admin SDK)
Firebase Console → Project settings → Service accounts → **Generate new private key**  
Збережи файл, напр. `serviceAccountKey.json`.

### 2) Експорт змінних оточення
**Windows PowerShell:**
```powershell
$env:GOOGLE_APPLICATION_CREDENTIALS="C:\path\serviceAccountKey.json"
$env:FIREBASE_PROJECT_ID="your-project-id"
```

**macOS/Linux:**
```bash
export GOOGLE_APPLICATION_CREDENTIALS="/path/serviceAccountKey.json"
export FIREBASE_PROJECT_ID="your-project-id"
```

### 3) Запуск
```bash
npm install
npm run seed:products
```

### 4) Зображення
У кожного товару буде поле `imagePath` типу:
`products/<slug>.jpg`

Ти зможеш завантажити файли в Firebase Storage саме під ці шляхи.
Після цього можна зробити окремий TASK, який:
- зчитує `imagePath`
- генерує `downloadURL`
- записує в `imageUrl`, щоб картинки відображались у UI.

---

## Seeding товарів у Firestore (одноразово)

Цей проєкт має скрипт, який **згенерує товари для всіх підкатегорій** (4 шт. на кожну) і запише у колекцію `products`.

### 1) Створи Service Account Key (для Admin SDK)
Firebase Console → Project settings → Service accounts → **Generate new private key**  
Збережи файл, напр. `serviceAccountKey.json`.

### 2) Експорт змінних оточення
**Windows PowerShell:**
```powershell
$env:GOOGLE_APPLICATION_CREDENTIALS="C:\path\serviceAccountKey.json"
$env:FIREBASE_PROJECT_ID="your-project-id"
```

**macOS/Linux:**
```bash
export GOOGLE_APPLICATION_CREDENTIALS="/path/serviceAccountKey.json"
export FIREBASE_PROJECT_ID="your-project-id"
```

### 3) Запуск
```bash
npm install
npm run seed:products
```

### 4) Зображення
У кожного товару буде поле `imagePath` типу:
`products/<slug>.jpg`

Ти зможеш завантажити файли в Firebase Storage саме під ці шляхи.
Після цього можна зробити окремий TASK, який:
- зчитує `imagePath`
- генерує `downloadURL`
- записує в `imageUrl`, щоб картинки відображались у UI.

---

## Локальні demo-картинки для seeded товарів (без Storage)

Для диплома можна тримати картинки локально (в репозиторії), щоб каталог виглядав “живим”.
Для цього є скрипт, який згенерує **SVG-заглушки** для всіх товарів у Firestore і збереже їх в `public/products`.

### Потрібно (як і для seed):
- `GOOGLE_APPLICATION_CREDENTIALS` — шлях до serviceAccountKey.json
- `FIREBASE_PROJECT_ID` — id firebase project

### Запуск
```bash
npm install
npm run gen:images
```

Після цього у каталозі `public/products/` з'являться файли `*.svg`, а UI покаже їх як фолбек, якщо `imageUrl` порожній.

> Наступний крок: для адміна додамо завантаження реального зображення у Firebase Storage при додаванні/редагуванні товару.

---

## Таблиця лінків на зображення товарів (Wikimedia Commons)

Скрипт читає `products` з Firestore і для кожного товару намагається знайти зображення на Wikimedia Commons
(перевага — вільні ліцензії) та генерує `product_images.csv`.

### Запуск (PowerShell)
```powershell
$env:GOOGLE_APPLICATION_CREDENTIALS="C:\path\serviceAccountKey.json"
$env:FIREBASE_PROJECT_ID="your-project-id"

npm i
npm run export:image-links
```

Результат: файл `product_images.csv` (productId → image_direct_url → commons_file_page → license).

---

## Таблиця лінків на зображення товарів (Wikimedia Commons)

Скрипт читає `products` з Firestore і для кожного товару намагається знайти зображення на Wikimedia Commons
(перевага — вільні ліцензії) та генерує `product_images.csv`.

### Запуск (PowerShell)
```powershell
$env:GOOGLE_APPLICATION_CREDENTIALS="C:\path\serviceAccountKey.json"
$env:FIREBASE_PROJECT_ID="your-project-id"

npm i
npm run export:image-links
```

Результат: файл `product_images.csv` (productId → image_direct_url → commons_file_page → license).

---

## TASK005: Reset + Import products (new schema)

✅ Цей таск додає скрипт, який:
- видаляє всі документи з колекції `products`
- імпортує нові продукти з новою структурою (unit, imagePath, description{...11})

### 1) Переконайся, що стартові зображення є в проєкті
Вони мають лежати в:
- `public/images/`

А в Firestore у кожного продукту `imagePath` має вигляд:
- `images/002.webp`

### 2) Запуск імпорту (одноразово)
**PowerShell:**
```powershell
$env:GOOGLE_APPLICATION_CREDENTIALS="C:\path\serviceAccountKey.json"
$env:FIREBASE_PROJECT_ID="your-project-id"

npm i
npm run products:reset-import
```

Після цього онови сторінку — каталог/товарні сторінки мають показувати зображення з `/public/images/`.

---

## TASK005-FIX1: Імпорт products з Excel (без base64)

### 1) Поклади файл Excel у репозиторій
Скопіюй твій Excel у:
- `scripts/medicinelist_new.xlsx`

> Файл НЕ повинен лежати в public.

### 2) Переконайся, що зображення є локально
Стартові зображення мають лежати в:
- `public/images/`

В Excel поле `imagePath` може бути:
- `002.webp` (тоді автоматично стане `images/002.webp`)
- або `images/002.webp`

### 3) Запуск імпорту (PowerShell)
```powershell
$env:GOOGLE_APPLICATION_CREDENTIALS="C:\path\serviceAccountKey.json"
$env:FIREBASE_PROJECT_ID="your-project-id"

npm i
npm run products:reset-import
```

Результат:
- колекція `products` буде повністю перезаписана
- структура `description` стане об'єктом з 11 англ. полів

---

## TASK006: Upload images to Firebase Storage from Admin (server API)

Адмін входить фіксованим логіном/паролем (без Firebase Auth), тому завантаження у Storage робимо через серверний API
з `firebase-admin`.

### ENV змінні (для локального запуску і Vercel)
1) Bucket:
- `FIREBASE_STORAGE_BUCKET` = `your-project-id.appspot.com`

2) Service account:
**Варіант A (рекомендовано):**
- `FIREBASE_ADMIN_CREDENTIALS_JSON` = *вміст serviceAccountKey.json як один JSON-рядок*

**Варіант B (локально):**
- `GOOGLE_APPLICATION_CREDENTIALS` = шлях до serviceAccountKey.json

> На Vercel зручніше використовувати варіант A (JSON в env).
