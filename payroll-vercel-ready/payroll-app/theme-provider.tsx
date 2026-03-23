"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useStore, type Employee } from "@/lib/store"
import { EmployeeForm } from "@/components/employee-form"
import { maskCard, formatRub, getInitials } from "@/lib/helpers"
import { Phone, CreditCard, Calendar, Briefcase, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { ru } from "date-fns/locale"

interface EmployeeDetailModalProps {
  employee: Employee | null
  open: boolean
  onClose: () => void
}

export function EmployeeDetailModal({
  employee,
  open,
  onClose,
}: EmployeeDetailModalProps) {
  const [editing, setEditing] = useState(false)
  const [confirmFire, setConfirmFire] = useState(false)
  const { updateEmployee, fireEmployee, rehireEmployee, payments } = useStore()

  if (!employee) return null

  const employeePayments = payments
    .filter((p) => p.employeeId === employee.id)
    .sort((a, b) => b.paydayDate.localeCompare(a.paydayDate))

  const initials = getInitials(employee.name)
  const active = employee.status === "active"

  const handleEdit = (data: {
    name: string
    phone?: string
    bankName: string
    cardNumber?: string
    position: string
    salaryRate: number
    hireDate: string
  }) => {
    updateEmployee(employee.id, data)
    toast.success("Данные сотрудника обновлены")
    setEditing(false)
  }

  const handleFire = () => {
    fireEmployee(employee.id)
    toast.success(`${employee.name} уволен`)
    setConfirmFire(false)
    onClose()
  }

  const handleRehire = () => {
    rehireEmployee(employee.id)
    toast.success(`${employee.name} возвращён в штат`)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Редактирование" : "Сотрудник"}</DialogTitle>
        </DialogHeader>

        {editing ? (
          <EmployeeForm
            defaultValues={employee}
            onSubmit={handleEdit}
            onCancel={() => setEditing(false)}
          />
        ) : (
          <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center gap-4">
              <div
                className={cn(
                  "w-16 h-16 rounded-2xl flex items-center justify-center text-lg font-bold",
                  active ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                )}
              >
                {initials}
              </div>
              <div>
                <p className="font-bold text-base leading-tight">{employee.name}</p>
                <p className="text-sm text-muted-foreground">{employee.position}</p>
                <span
                  className={cn(
                    "inline-block text-xs font-medium px-2 py-0.5 rounded-full mt-1",
                    active
                      ? "bg-emerald-500/15 text-emerald-400"
                      : "bg-rose-500/15 text-rose-400"
                  )}
                >
                  {active ? "Активен" : "Уволен"}
                </span>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-3 text-sm">
              {employee.phone && (
                <a
                  href={`tel:${employee.phone}`}
                  className="flex items-center gap-3 text-primary"
                >
                  <Phone className="w-4 h-4" />
                  {employee.phone}
                </a>
              )}
              {employee.cardNumber && (
                <div className="flex items-center gap-3 text-foreground">
                  <CreditCard className="w-4 h-4 text-muted-foreground" />
                  <span>
                    {employee.bankName} — {maskCard(employee.cardNumber)}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-3 text-foreground">
                <Briefcase className="w-4 h-4 text-muted-foreground" />
                <span>Ставка: <span className="font-semibold">{formatRub(employee.salaryRate)}</span></span>
              </div>
              <div className="flex items-center gap-3 text-foreground">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>
                  Принят:{" "}
                  {format(new Date(employee.hireDate), "d MMMM yyyy", { locale: ru })}
                </span>
              </div>
              {employee.fireDate && (
                <div className="flex items-center gap-3 text-rose-400">
                  <Calendar className="w-4 h-4" />
                  <span>
                    Уволен:{" "}
                    {format(new Date(employee.fireDate), "d MMMM yyyy", { locale: ru })}
                  </span>
                </div>
              )}
            </div>

            {/* Payment history */}
            {employeePayments.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  История выплат
                </p>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {employeePayments.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between text-sm bg-secondary rounded-lg px-3 py-2"
                    >
                      <span className="text-muted-foreground">{p.paydayDate}</span>
                      <span className="font-semibold">{formatRub(p.amount)}</span>
                      <span
                        className={cn(
                          "text-xs",
                          p.paid ? "text-emerald-400" : "text-amber-400"
                        )}
                      >
                        {p.paid ? "Выплачено" : "Ожидает"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-2 pt-1">
              <Button onClick={() => setEditing(true)} variant="outline" className="w-full">
                Редактировать
              </Button>
              {active ? (
                confirmFire ? (
                  <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-3 space-y-2">
                    <div className="flex items-center gap-2 text-destructive text-sm">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>Уволить сотрудника? Это действие можно отменить.</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1 text-xs"
                        onClick={() => setConfirmFire(false)}
                      >
                        Отмена
                      </Button>
                      <Button
                        variant="destructive"
                        className="flex-1 text-xs"
                        onClick={handleFire}
                      >
                        Уволить
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={() => setConfirmFire(true)}
                  >
                    Уволить
                  </Button>
                )
              ) : (
                <Button onClick={handleRehire} className="w-full">
                  Вернуть в штат
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
