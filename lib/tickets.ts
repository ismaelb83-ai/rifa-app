// Distribución de precios según lo acordado: total $10,300
const PRICE_POOL = [
  ...Array(10).fill(10),
  ...Array(8).fill(20),
  ...Array(5).fill(30),
  ...Array(5).fill(50),
  ...Array(5).fill(80),
  ...Array(29).fill(100),
  ...Array(20).fill(150),
  ...Array(13).fill(180),
  ...Array(5).fill(200),
]

// Baraja aleatoriamente un array (Fisher-Yates)
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Asigna precios aleatorios a los números disponibles
// Los números confirmados mantienen su precio real de la DB
export function shufflePrices(availableNumbers: number[]): Map<number, number> {
  const prices = shuffle(PRICE_POOL.slice(0, availableNumbers.length))
  const map = new Map<number, number>()
  availableNumbers.forEach((num, i) => map.set(num, prices[i]))
  return map
}
