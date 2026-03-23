export function maskCard(cardNumber: string): string {
  if (!cardNumber || cardNumber.length < 4) return cardNumber
  const last4 = cardNumber.slice(-4)
  return `•••• •••• •••• ${last4}`
}

export function formatRub(amount: number): string {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(amount)
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

export function getCurrentMonth(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

export function getPaydayDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
}

export const BANKS = ["Сбер", "Тинькофф", "Альфа", "ВТБ", "Райффайзен", "Другой"]

export const POSITIONS = [
  "Водитель",
  "Водитель-грузчик",
  "Грузчик",
  "Горничная",
  "Хаусмен",
  "Озеленитель",
  "Стюард",
  "Стюард ночной",
  "Повар",
  "Уборщик",
  "Другое",
]
