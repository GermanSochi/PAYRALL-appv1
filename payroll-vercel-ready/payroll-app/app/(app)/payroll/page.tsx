"use client"

import { useState, useMemo, useRef } from "react"
import { useStore, type Payment } from "@/lib/store"
import { formatRub, getInitials, maskCard } from "@/lib/helpers"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Upload, CheckCheck, Download, FileSpreadsheet } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { nanoid } from "nanoid"

type FilterMode = "all" | "unpaid" | "paid"

const MONTHS_RU = [
  "Январь", "Февраль", "Март", "Апрель",
  "Май", "Июнь", "Июль", "Август",
  "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
]

export default function PayrollPage() {
  const { employees, payments, markPaid, markAllPaid, setPayments, payday } = useStore()
  const today = new Date()
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(today.getFullYear())
  const [filterMode, setFilterMode] = useState<FilterMode>("all")
  const [xlsxModal, setXlsxModal] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // Excel state
  const [xlsxRows, setXlsxRows] = useState<string[][]>([])
  const [xlsxHeaders, setXlsxHeaders] = useState<string[]>([])
  const [colName, setColName] = useState("")
  const [colWork, setColWork] = useState("")
  const [calcType, setCalcType] = useState<"days" | "hours">("days")
  const [xlsxLoading, setXlsxLoading] = useState(false)

  const paydayDate = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-${String(payday).padStart(2, "0")}`

  const periodPayments = useMemo(
    () => payments.filter((p) => p.paydayDate === paydayDate),
    [payments, paydayDate]
  )

  const filteredPayments = useMemo(() => {
    let list = periodPayments
    if (filterMode === "unpaid") list = list.filter((p) => !p.paid)
    if (filterMode === "paid") list = list.filter((p) => p.paid)
    return list
  }, [periodPayments, filterMode])

  const paymentsWithEmployee = useMemo(
    () =>
      filteredPayments
        .map((p) => ({
          payment: p,
          employee: employees.find((e) => e.id === p.employeeId),
        }))
        .filter((x) => x.employee)
        .sort((a, b) => a.employee!.name.localeCompare(b.employee!.name, "ru")),
    [filteredPayments, employees]
  )

  const unpaidCount = periodPayments.filter((p) => !p.paid).length
  const totalAmount = periodPayments.reduce((s, p) => s + p.amount, 0)
  const paidAmount = periodPayments.filter((p) => p.paid).reduce((s, p) => s + p.amount, 0)

  const handleMarkPaid = (id: string, name: string) => {
    markPaid(id)
    toast.success(`Перевод отмечен — ${name}`)
  }

  const handleMarkAll = () => {
    markAllPaid(paydayDate)
    toast.success("Все выплаты отмечены как выполненные")
  }

  // Generate payments for current month if none
  const handleGeneratePayments = () => {
    const activeEmps = employees.filter((e) => e.status === "active")
    const newPays: Payment[] = activeEmps
      .filter((e) => !periodPayments.find((p) => p.employeeId === e.id))
      .map((e) => ({
        id: nanoid(),
        employeeId: e.id,
        paydayDate,
        amount: e.salaryRate,
        paid: false,
      }))
    if (newPays.length === 0) {
      toast.info("Все сотрудники уже в списке")
      return
    }
    setPayments([...periodPayments, ...newPays])
    toast.success(`Добавлено ${newPays.length} сотрудников в список`)
  }

  // Excel upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setXlsxLoading(true)
    try {
      const { read, utils } = await import("xlsx")
      const buf = await file.arrayBuffer()
      const wb = read(buf)
      const ws = wb.Sheets[wb.SheetNames[0]]
      const data: string[][] = utils.sheet_to_json(ws, { header: 1, raw: false })
      if (data.length < 2) {
        toast.error("Файл пустой или некорректный")
        return
      }
      const headers = (data[0] || []).map(String)
      setXlsxHeaders(headers)
      setXlsxRows(data.slice(1) as string[][])
      setColName(headers[0] ?? "")
      setColWork(headers[1] ?? "")
      setXlsxModal(true)
    } catch {
      toast.error("Не удалось прочитать файл")
    } finally {
      setXlsxLoading(false)
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  const handleApplyXlsx = () => {
    const nameIdx = xlsxHeaders.indexOf(colName)
    const workIdx = xlsxHeaders.indexOf(colWork)
    if (nameIdx === -1 || workIdx === -1) {
      toast.error("Выберите корректные колонки")
      return
    }
    const divisor = calcType === "days" ? 21 : 168
    const newPays: Payment[] = []

    for (const row of xlsxRows) {
      const rawName = String(row[nameIdx] ?? "").trim()
      const rawWork = parseFloat(String(row[workIdx] ?? "").replace(",", "."))
      if (!rawName || isNaN(rawWork)) continue

      const emp = employees.find(
        (e) =>
          e.name.toLowerCase().includes(rawName.toLowerCase()) ||
          rawName.toLowerCase().includes(e.name.toLowerCase().split(" ")[0])
      )
      if (!emp) continue

      const amount = Math.round((emp.salaryRate * rawWork) / divisor)
      const existing = periodPayments.find((p) => p.employeeId === emp.id)
      if (existing) continue

      newPays.push({
        id: nanoid(),
        employeeId: emp.id,
        paydayDate,
        amount,
        paid: false,
      })
    }

    if (newPays.length === 0) {
      toast.error("Совпадений не найдено. Проверьте имена в табеле.")
      return
    }
    setPayments([...periodPayments, ...newPays])
    toast.success(`Загружено ${newPays.length} записей из табеля`)
    setXlsxModal(false)
  }

  const handleExport = async () => {
    const { utils, writeFile } = await import("xlsx")
    const rows = paymentsWithEmployee.map(({ payment, employee }) => ({
      ФИО: employee!.name,
      Должность: employee!.position,
      Банк: employee!.bankName,
      "Карта (последние 4)": employee!.cardNumber.slice(-4),
      "Сумма (₽)": payment.amount,
      Статус: payment.paid ? "Оплачено" : "Ожидает",
    }))
    const ws = utils.json_to_sheet(rows)
    const wb = utils.book_new()
    utils.book_append_sheet(wb, ws, "Зарплата")
    writeFile(wb, `zarplata_${paydayDate}.xlsx`)
    toast.success("Файл скачан")
  }

  const years = [today.getFullYear() - 1, today.getFullYear()]

  return (
    <div className="px-4 pt-5 pb-4 max-w-lg mx-auto">
      <h1 className="text-xl font-bold mb-1">Зарплата</h1>
      <p className="text-sm text-muted-foreground mb-4">День выплаты: {payday}-е число</p>

      {/* Period selector */}
      <div className="flex gap-2 mb-4">
        <Select
          value={String(selectedMonth)}
          onValueChange={(v) => setSelectedMonth(Number(v))}
        >
          <SelectTrigger className="flex-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MONTHS_RU.map((m, i) => (
              <SelectItem key={i + 1} value={String(i + 1)}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={String(selectedYear)}
          onValueChange={(v) => setSelectedYear(Number(v))}
        >
          <SelectTrigger className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {years.map((y) => (
              <SelectItem key={y} value={String(y)}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary */}
      {periodPayments.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-4">
          <SummaryChip label="Всего" value={formatRub(totalAmount)} color="default" />
          <SummaryChip label="Выплачено" value={formatRub(paidAmount)} color="green" />
          <SummaryChip
            label="Ожидает"
            value={formatRub(totalAmount - paidAmount)}
            color="amber"
          />
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={handleFileChange}
        />
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-1.5 text-xs"
          onClick={() => fileRef.current?.click()}
          disabled={xlsxLoading}
        >
          <FileSpreadsheet className="w-4 h-4" />
          {xlsxLoading ? "Загрузка…" : "Загрузить табель"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-1.5 text-xs"
          onClick={handleGeneratePayments}
        >
          <Upload className="w-4 h-4" />
          Авто-список
        </Button>
        {unpaidCount > 0 && (
          <Button
            size="sm"
            className="flex items-center gap-1.5 text-xs"
            onClick={handleMarkAll}
          >
            <CheckCheck className="w-4 h-4" />
            Отметить всех
          </Button>
        )}
        {periodPayments.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1.5 text-xs"
            onClick={handleExport}
          >
            <Download className="w-4 h-4" />
            Excel
          </Button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1.5 mb-4">
        {(["all", "unpaid", "paid"] as FilterMode[]).map((mode) => {
          const label =
            mode === "all" ? "Все" : mode === "unpaid" ? "Неоплаченные" : "Оплаченные"
          return (
            <button
              key={mode}
              onClick={() => setFilterMode(mode)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                filterMode === mode
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              )}
            >
              {label}
            </button>
          )
        })}
      </div>

      {/* Payment list */}
      {paymentsWithEmployee.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <FileSpreadsheet className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Нет данных за этот период</p>
          <p className="text-xs mt-1">Загрузите табель или нажмите «Авто-список»</p>
        </div>
      ) : (
        <div className="space-y-2">
          {paymentsWithEmployee.map(({ payment, employee }) => (
            <PaymentCard
              key={payment.id}
              payment={payment}
              name={employee!.name}
              position={employee!.position}
              bankName={employee!.bankName}
              cardNumber={employee!.cardNumber}
              onToggle={() => handleMarkPaid(payment.id, employee!.name)}
            />
          ))}
        </div>
      )}

      {/* Excel mapping modal */}
      <Dialog open={xlsxModal} onOpenChange={(v) => !v && setXlsxModal(false)}>
        <DialogContent className="max-w-md w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Настройка табеля</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Preview */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Превью (первые 5 строк)
              </p>
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="text-xs w-full">
                  <thead>
                    <tr className="border-b border-border bg-secondary">
                      {xlsxHeaders.map((h, i) => (
                        <th key={i} className="px-2 py-1.5 text-left font-medium text-muted-foreground">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {xlsxRows.slice(0, 5).map((row, ri) => (
                      <tr key={ri} className="border-b border-border/50">
                        {xlsxHeaders.map((_, ci) => (
                          <td key={ci} className="px-2 py-1.5 text-foreground">
                            {row[ci] ?? "—"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Column mapping */}
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Колонка с ФИО</label>
                <Select value={colName} onValueChange={setColName}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите колонку" />
                  </SelectTrigger>
                  <SelectContent>
                    {xlsxHeaders.map((h) => (
                      <SelectItem key={h} value={h}>{h}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Колонка с отработанным</label>
                <Select value={colWork} onValueChange={setColWork}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите колонку" />
                  </SelectTrigger>
                  <SelectContent>
                    {xlsxHeaders.map((h) => (
                      <SelectItem key={h} value={h}>{h}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Тип расчёта</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCalcType("days")}
                    className={cn(
                      "flex-1 py-2 rounded-lg text-sm font-medium transition-colors",
                      calcType === "days"
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-foreground"
                    )}
                  >
                    Дни (÷ 21)
                  </button>
                  <button
                    onClick={() => setCalcType("hours")}
                    className={cn(
                      "flex-1 py-2 rounded-lg text-sm font-medium transition-colors",
                      calcType === "hours"
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-foreground"
                    )}
                  >
                    Часы (÷ 168)
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => setXlsxModal(false)}>
                Отмена
              </Button>
              <Button className="flex-1" onClick={handleApplyXlsx}>
                Рассчитать
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function PaymentCard({
  payment,
  name,
  position,
  bankName,
  cardNumber,
  onToggle,
}: {
  payment: Payment
  name: string
  position: string
  bankName: string
  cardNumber: string
  onToggle: () => void
}) {
  return (
    <div
      className={cn(
        "bg-card border rounded-xl px-4 py-3 flex items-center gap-3 transition-colors",
        payment.paid ? "border-emerald-500/30 opacity-75" : "border-border"
      )}
    >
      <div
        className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
          payment.paid ? "bg-emerald-500/15 text-emerald-400" : "bg-primary/20 text-primary"
        )}
      >
        {getInitials(name)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">{name}</p>
        <p className="text-xs text-muted-foreground">
          {bankName} {maskCard(cardNumber)}
        </p>
      </div>
      <div className="text-right shrink-0 mr-2">
        <p className="text-sm font-bold">{formatRub(payment.amount)}</p>
        <p className={cn("text-xs", payment.paid ? "text-emerald-400" : "text-amber-400")}>
          {payment.paid ? "Выплачено" : "Ожидает"}
        </p>
      </div>
      <Switch
        checked={payment.paid}
        onCheckedChange={() => !payment.paid && onToggle()}
        aria-label={`Отметить выплату для ${name}`}
        disabled={payment.paid}
      />
    </div>
  )
}

function SummaryChip({
  label,
  value,
  color,
}: {
  label: string
  value: string
  color: "default" | "green" | "amber"
}) {
  const colorMap = {
    default: "bg-secondary text-foreground",
    green: "bg-emerald-500/10 text-emerald-400",
    amber: "bg-amber-500/10 text-amber-400",
  }
  return (
    <div className={cn("rounded-xl p-2.5", colorMap[color])}>
      <p className="text-xs text-current/70 mb-0.5">{label}</p>
      <p className="text-xs font-bold leading-tight">{value}</p>
    </div>
  )
}
