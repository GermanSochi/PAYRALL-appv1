"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useStore } from "@/lib/store"
import { formatRub, getInitials, maskCard } from "@/lib/helpers"
import { Users, TrendingDown, Wallet, ChevronRight, CalendarDays } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

export default function DashboardPage() {
  const { employees, payments, payday, setPayday } = useStore()
  const [changingPayday, setChangingPayday] = useState(false)

  const today = new Date()
  const currentMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`
  const paydayDate = `${currentMonthStr}-${String(payday).padStart(2, "0")}`

  const activeEmployees = useMemo(
    () => employees.filter((e) => e.status === "active"),
    [employees]
  )

  const firedThisMonth = useMemo(() => {
    return employees.filter((e) => {
      if (e.status !== "fired" || !e.fireDate) return false
      return e.fireDate.startsWith(currentMonthStr)
    }).length
  }, [employees, currentMonthStr])

  const unpaidPayments = useMemo(
    () =>
      payments.filter((p) => p.paydayDate === paydayDate && !p.paid),
    [payments, paydayDate]
  )

  const totalUnpaid = useMemo(
    () => unpaidPayments.reduce((sum, p) => sum + p.amount, 0),
    [unpaidPayments]
  )

  const unpaidWithEmployee = useMemo(
    () =>
      unpaidPayments
        .map((p) => ({
          payment: p,
          employee: employees.find((e) => e.id === p.employeeId),
        }))
        .filter((x) => x.employee),
    [unpaidPayments, employees]
  )

  const daysToPayday = useMemo(() => {
    const pay = new Date(paydayDate)
    const diff = Math.ceil((pay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return diff
  }, [paydayDate, today])

  return (
    <div className="px-4 pt-5 pb-4 space-y-5 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold leading-tight">Главная</h1>
          <p className="text-sm text-muted-foreground">
            {today.toLocaleDateString("ru-RU", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </p>
        </div>
      </div>

      {/* Payday card */}
      <div className="bg-primary/10 border border-primary/30 rounded-2xl p-4">
        <div className="flex items-center gap-3 mb-3">
          <CalendarDays className="w-5 h-5 text-primary" />
          <p className="font-semibold text-sm text-primary">День выплаты</p>
        </div>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-2xl font-bold text-foreground">
              {payday}-е число
            </p>
            <p className="text-sm text-muted-foreground mt-0.5">
              {daysToPayday > 0
                ? `через ${daysToPayday} дн.`
                : daysToPayday === 0
                ? "Сегодня!"
                : `${Math.abs(daysToPayday)} дн. назад`}
            </p>
          </div>
          {changingPayday ? (
            <div className="flex gap-2">
              {[5, 10, 15, 20, 25].map((d) => (
                <button
                  key={d}
                  onClick={() => {
                    setPayday(d)
                    setChangingPayday(false)
                    toast.success(`День выплаты изменён на ${d}-е`)
                  }}
                  className={cn(
                    "w-9 h-9 rounded-lg text-sm font-semibold transition-colors",
                    d === payday
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-foreground hover:bg-primary/20"
                  )}
                >
                  {d}
                </button>
              ))}
            </div>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setChangingPayday(true)}
              className="text-xs"
            >
              Изменить
            </Button>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          icon={<Users className="w-4 h-4" />}
          label="Активных"
          value={String(activeEmployees.length)}
          color="blue"
        />
        <StatCard
          icon={<Wallet className="w-4 h-4" />}
          label="К выплате"
          value={formatRub(totalUnpaid)}
          color="green"
          small
        />
        <StatCard
          icon={<TrendingDown className="w-4 h-4" />}
          label="Уволено"
          value={String(firedThisMonth)}
          sub="за месяц"
          color="red"
        />
      </div>

      {/* Unpaid list */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-sm">Не оплачено в этом месяце</h2>
          <Link
            href="/payroll"
            className="text-xs text-primary flex items-center gap-0.5"
          >
            Все <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        {unpaidWithEmployee.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            Все выплаты выполнены!
          </div>
        ) : (
          <div className="space-y-2">
            {unpaidWithEmployee.map(({ payment, employee }) => (
              <div
                key={payment.id}
                className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-3"
              >
                <div className="w-9 h-9 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                  {getInitials(employee!.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{employee!.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {employee!.bankName} {maskCard(employee!.cardNumber)}
                  </p>
                </div>
                <p className="text-sm font-bold text-foreground shrink-0">
                  {formatRub(payment.amount)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload timesheet button */}
      <Link href="/payroll" className="block">
        <Button className="w-full h-12 text-sm font-semibold">
          Перейти к зарплате
        </Button>
      </Link>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  sub,
  color,
  small,
}: {
  icon: React.ReactNode
  label: string
  value: string
  sub?: string
  color: "blue" | "green" | "red"
  small?: boolean
}) {
  const colorMap = {
    blue: "text-blue-400 bg-blue-400/10",
    green: "text-emerald-400 bg-emerald-400/10",
    red: "text-rose-400 bg-rose-400/10",
  }
  return (
    <div className="bg-card border border-border rounded-xl p-3 flex flex-col gap-2">
      <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center", colorMap[color])}>
        {icon}
      </div>
      <div>
        <p className={cn("font-bold leading-tight", small ? "text-sm" : "text-lg")}>{value}</p>
        <p className="text-xs text-muted-foreground leading-tight">{label}</p>
        {sub && <p className="text-xs text-muted-foreground leading-tight">{sub}</p>}
      </div>
    </div>
  )
}
