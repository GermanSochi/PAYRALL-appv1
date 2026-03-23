"use client"

import { useMemo } from "react"
import { useStore } from "@/lib/store"
import { formatRub } from "@/lib/helpers"
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { Button } from "@/components/ui/button"
import { Download, TrendingUp, Users, Percent, Banknote } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const MONTHS_SHORT = [
  "Янв", "Фев", "Мар", "Апр", "Май", "Июн",
  "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек",
]

const CHART_COLORS = [
  "hsl(200 90% 50%)",
  "hsl(160 60% 50%)",
  "hsl(280 60% 60%)",
  "hsl(40 90% 55%)",
  "hsl(0 70% 55%)",
]

export default function StatsPage() {
  const { employees, payments } = useStore()
  const today = new Date()
  const currentYear = today.getFullYear()

  // Monthly salary totals (last 12 months)
  const monthlyData = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date(today.getFullYear(), today.getMonth() - 11 + i, 1)
      const y = d.getFullYear()
      const m = d.getMonth() + 1
      const key = `${y}-${String(m).padStart(2, "0")}`
      const total = payments
        .filter((p) => p.paydayDate.startsWith(key) && p.paid)
        .reduce((s, p) => s + p.amount, 0)
      return {
        name: MONTHS_SHORT[m - 1],
        total,
        year: y,
        month: m,
      }
    })
  }, [payments])

  // Top 5 employees by total paid
  const top5 = useMemo(() => {
    const map = new Map<string, number>()
    payments.filter((p) => p.paid).forEach((p) => {
      map.set(p.employeeId, (map.get(p.employeeId) ?? 0) + p.amount)
    })
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, total]) => ({
        name: employees.find((e) => e.id === id)?.name.split(" ")[0] ?? "Неизвестно",
        total,
      }))
  }, [payments, employees])

  // Active vs fired per month (last 6 months)
  const staffData = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(today.getFullYear(), today.getMonth() - 5 + i, 1)
      const y = d.getFullYear()
      const m = d.getMonth() + 1
      const monthEnd = `${y}-${String(m).padStart(2, "0")}-31`
      const active = employees.filter(
        (e) =>
          e.status === "active" ||
          (e.fireDate && e.fireDate > monthEnd)
      ).length
      const fired = employees.filter(
        (e) => e.fireDate && e.fireDate.startsWith(`${y}-${String(m).padStart(2, "0")}`)
      ).length
      return { name: MONTHS_SHORT[m - 1], active, fired }
    })
  }, [employees])

  // KPIs
  const totalPaidYear = useMemo(
    () =>
      payments
        .filter((p) => p.paid && p.paydayDate.startsWith(String(currentYear)))
        .reduce((s, p) => s + p.amount, 0),
    [payments, currentYear]
  )

  const avgSalary = useMemo(() => {
    const active = employees.filter((e) => e.status === "active")
    if (active.length === 0) return 0
    return Math.round(active.reduce((s, e) => s + e.salaryRate, 0) / active.length)
  }, [employees])

  const turnoverRate = useMemo(() => {
    const firedYear = employees.filter(
      (e) => e.fireDate && e.fireDate.startsWith(String(currentYear))
    ).length
    const total = employees.length
    return total === 0 ? 0 : Math.round((firedYear / total) * 100)
  }, [employees, currentYear])

  const handleExport = async () => {
    const { utils, writeFile } = await import("xlsx")
    const rows = employees.map((e) => {
      const totalPaid = payments
        .filter((p) => p.employeeId === e.id && p.paid)
        .reduce((s, p) => s + p.amount, 0)
      return {
        ФИО: e.name,
        Должность: e.position,
        Статус: e.status === "active" ? "Активен" : "Уволен",
        Ставка: e.salaryRate,
        "Выплачено всего": totalPaid,
      }
    })
    const ws = utils.json_to_sheet(rows)
    const wb = utils.book_new()
    utils.book_append_sheet(wb, ws, "Статистика")
    writeFile(wb, `statistika_${currentYear}.xlsx`)
    toast.success("Файл скачан")
  }

  return (
    <div className="px-4 pt-5 pb-4 max-w-lg mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Статистика</h1>
          <p className="text-sm text-muted-foreground">{currentYear} год</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-1.5 text-xs"
          onClick={handleExport}
        >
          <Download className="w-3.5 h-3.5" />
          Excel
        </Button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3">
        <KpiCard
          icon={<Banknote className="w-4 h-4" />}
          label="Выплачено за год"
          value={formatRub(totalPaidYear)}
          color="blue"
        />
        <KpiCard
          icon={<TrendingUp className="w-4 h-4" />}
          label="Средняя зарплата"
          value={formatRub(avgSalary)}
          color="green"
        />
        <KpiCard
          icon={<Users className="w-4 h-4" />}
          label="Активных сейчас"
          value={String(employees.filter((e) => e.status === "active").length)}
          color="default"
        />
        <KpiCard
          icon={<Percent className="w-4 h-4" />}
          label="Текучка за год"
          value={`${turnoverRate}%`}
          color="red"
        />
      </div>

      {/* Monthly totals chart */}
      <div className="bg-card border border-border rounded-2xl p-4">
        <p className="text-sm font-semibold mb-4">Выплаты по месяцам</p>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={monthlyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border)/0.5)" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${Math.round(v / 1000)}k`}
            />
            <Tooltip
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "0.5rem",
                fontSize: "12px",
                color: "hsl(var(--foreground))",
              }}
              formatter={(v: number) => [formatRub(v), "Выплачено"]}
            />
            <Line
              type="monotone"
              dataKey="total"
              stroke="hsl(200 90% 50%)"
              strokeWidth={2.5}
              dot={{ r: 3, fill: "hsl(200 90% 50%)" }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Top 5 pie chart */}
      {top5.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-4">
          <p className="text-sm font-semibold mb-4">Топ-5 по выплатам</p>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width={140} height={140}>
              <PieChart>
                <Pie
                  data={top5}
                  dataKey="total"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={65}
                  paddingAngle={3}
                >
                  {top5.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "0.5rem",
                    fontSize: "12px",
                    color: "hsl(var(--foreground))",
                  }}
                  formatter={(v: number) => [formatRub(v), ""]}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-1.5">
              {top5.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
                  />
                  <span className="text-xs text-foreground truncate flex-1">{item.name}</span>
                  <span className="text-xs font-semibold shrink-0">{formatRub(item.total)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Staff bar chart */}
      <div className="bg-card border border-border rounded-2xl p-4">
        <p className="text-sm font-semibold mb-4">Активные / Уволенные</p>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={staffData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border)/0.5)" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "0.5rem",
                fontSize: "12px",
                color: "hsl(var(--foreground))",
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: "11px", color: "hsl(var(--muted-foreground))" }}
            />
            <Bar dataKey="active" name="Активные" fill="hsl(200 90% 50%)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="fired" name="Уволенные" fill="hsl(0 70% 55%)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function KpiCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: string
  color: "blue" | "green" | "red" | "default"
}) {
  const colorMap = {
    blue: "text-blue-400 bg-blue-400/10",
    green: "text-emerald-400 bg-emerald-400/10",
    red: "text-rose-400 bg-rose-400/10",
    default: "text-muted-foreground bg-secondary",
  }
  return (
    <div className="bg-card border border-border rounded-xl p-3 flex flex-col gap-2">
      <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center", colorMap[color])}>
        {icon}
      </div>
      <div>
        <p className="text-base font-bold leading-tight">{value}</p>
        <p className="text-xs text-muted-foreground leading-tight mt-0.5">{label}</p>
      </div>
    </div>
  )
}
