// Для диплома перелік аптек уже фіксований у data/pharmacies.ts,
// тому цей скрипт НЕ є обов'язковим.
// Він просто виводить JSON у консоль, якщо захочеш вручну внести в DB.

import { PHARMACIES } from '../data/pharmacies.ts'

console.log(JSON.stringify(PHARMACIES, null, 2))
