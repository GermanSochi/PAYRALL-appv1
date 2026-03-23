import { create } from "zustand"
import { persist } from "zustand/middleware"

export type Employee = {
  id: string
  name: string
  phone: string
  bankName: string
  cardNumber: string
  salaryRate: number
  position: string
  hireDate: string
  fireDate?: string
  status: "active" | "fired"
}

export type Payment = {
  id: string
  employeeId: string
  paydayDate: string
  amount: number
  paid: boolean
  paidAt?: string
}

const SEED_EMPLOYEES: Employee[] = [
  {
    id: "emp-1",
    name: "Бабамуродов Ахмадулла Хасанович",
    phone: "+7 999 111 2233",
    bankName: "Сбер",
    cardNumber: "4276000011112233",
    salaryRate: 55000,
    position: "Водитель-грузчик",
    hireDate: "2023-03-15",
    status: "active",
  },
  {
    id: "emp-2",
    name: "Акбаров Марифжон Мамаджонович",
    phone: "+7 999 222 3344",
    bankName: "Тинькофф",
    cardNumber: "5213000022223344",
    salaryRate: 48000,
    position: "Озеленитель",
    hireDate: "2023-05-01",
    status: "active",
  },
  {
    id: "emp-3",
    name: "Анохина Любовь Владимировна",
    phone: "+7 999 333 4455",
    bankName: "Альфа",
    cardNumber: "4034000033334455",
    salaryRate: 62000,
    position: "Стюард",
    hireDate: "2022-11-20",
    status: "active",
  },
  {
    id: "emp-4",
    name: "Гулиева Наталья",
    phone: "+7 999 444 5566",
    bankName: "Сбер",
    cardNumber: "4276000044445566",
    salaryRate: 52000,
    position: "Повар",
    hireDate: "2023-01-10",
    status: "active",
  },
  {
    id: "emp-5",
    name: "Свечников Глеб",
    phone: "+7 999 555 6677",
    bankName: "ВТБ",
    cardNumber: "4272000055556677",
    salaryRate: 58000,
    position: "Стюард",
    hireDate: "2023-07-15",
    status: "active",
  },
  {
    id: "emp-6",
    name: "Туропов Озодбек",
    phone: "+7 999 666 7788",
    bankName: "Тинькофф",
    cardNumber: "5213000066667788",
    salaryRate: 54000,
    position: "Стюард ночной",
    hireDate: "2023-09-01",
    status: "active",
  },
  {
    id: "emp-7",
    name: "Разакова Алида",
    phone: "+7 999 777 8899",
    bankName: "Сбер",
    cardNumber: "4276000077778899",
    salaryRate: 47000,
    position: "Горничная",
    hireDate: "2023-06-01",
    fireDate: "2024-02-15",
    status: "fired",
  },
]

const today = new Date()
const thisMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-10`

const SEED_PAYMENTS: Payment[] = SEED_EMPLOYEES.filter(
  (e) => e.status === "active"
).map((e) => ({
  id: `pay-${e.id}`,
  employeeId: e.id,
  paydayDate: thisMonth,
  amount: e.salaryRate,
  paid: false,
}))

type AppStore = {
  employees: Employee[]
  payments: Payment[]
  payday: number // 5 or 10
  setPayday: (day: number) => void
  addEmployee: (emp: Employee) => void
  updateEmployee: (id: string, data: Partial<Employee>) => void
  fireEmployee: (id: string) => void
  rehireEmployee: (id: string) => void
  addPayment: (pay: Payment) => void
  updatePayment: (id: string, data: Partial<Payment>) => void
  markPaid: (id: string) => void
  markAllPaid: (paydayDate: string) => void
  setPayments: (pays: Payment[]) => void
  initialized: boolean
}

export const useStore = create<AppStore>()(
  persist(
    (set, get) => ({
      employees: SEED_EMPLOYEES,
      payments: SEED_PAYMENTS,
      payday: 10,
      initialized: false,
      setPayday: (day) => set({ payday: day }),
      addEmployee: (emp) =>
        set((s) => ({ employees: [...s.employees, emp] })),
      updateEmployee: (id, data) =>
        set((s) => ({
          employees: s.employees.map((e) => (e.id === id ? { ...e, ...data } : e)),
        })),
      fireEmployee: (id) =>
        set((s) => ({
          employees: s.employees.map((e) =>
            e.id === id
              ? { ...e, status: "fired", fireDate: new Date().toISOString().slice(0, 10) }
              : e
          ),
        })),
      rehireEmployee: (id) =>
        set((s) => ({
          employees: s.employees.map((e) =>
            e.id === id ? { ...e, status: "active", fireDate: undefined } : e
          ),
        })),
      addPayment: (pay) =>
        set((s) => ({ payments: [...s.payments, pay] })),
      updatePayment: (id, data) =>
        set((s) => ({
          payments: s.payments.map((p) => (p.id === id ? { ...p, ...data } : p)),
        })),
      markPaid: (id) =>
        set((s) => ({
          payments: s.payments.map((p) =>
            p.id === id ? { ...p, paid: true, paidAt: new Date().toISOString() } : p
          ),
        })),
      markAllPaid: (paydayDate) =>
        set((s) => ({
          payments: s.payments.map((p) =>
            p.paydayDate === paydayDate && !p.paid
              ? { ...p, paid: true, paidAt: new Date().toISOString() }
              : p
          ),
        })),
      setPayments: (pays) =>
        set((s) => {
          const existing = s.payments.filter(
            (p) => !pays.some((np) => np.paydayDate === p.paydayDate && np.employeeId === p.employeeId)
          )
          return { payments: [...existing, ...pays] }
        }),
    }),
    { name: "zarplata-storage" }
  )
)
