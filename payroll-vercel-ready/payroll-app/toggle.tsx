"use client"

import { Phone, CreditCard } from "lucide-react"
import { cn } from "@/lib/utils"
import { maskCard, formatRub, getInitials } from "@/lib/helpers"
import type { Employee } from "@/lib/store"

interface EmployeeCardProps {
  employee: Employee
  onClick?: () => void
  className?: string
}

export function EmployeeCard({ employee, onClick, className }: EmployeeCardProps) {
  const initials = getInitials(employee.name)
  const active = employee.status === "active"

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full text-left bg-card border border-border rounded-xl p-4 flex gap-3 items-start transition-colors active:scale-[0.98] active:bg-secondary",
        !active && "opacity-60",
        className
      )}
      aria-label={`Открыть профиль: ${employee.name}`}
    >
      {/* Avatar */}
      <div
        className={cn(
          "w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
          active
            ? "bg-primary/20 text-primary"
            : "bg-muted text-muted-foreground"
        )}
        aria-hidden="true"
      >
        {initials}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <p className="font-semibold text-sm text-foreground truncate leading-tight">
            {employee.name}
          </p>
          <span
            className={cn(
              "text-xs font-medium px-2 py-0.5 rounded-full shrink-0",
              active
                ? "bg-emerald-500/15 text-emerald-400"
                : "bg-rose-500/15 text-rose-400"
            )}
          >
            {active ? "Активен" : "Уволен"}
          </span>
        </div>

        <p className="text-xs text-muted-foreground mb-2">{employee.position}</p>

        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {employee.phone && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Phone className="w-3 h-3 shrink-0" />
              {employee.phone}
            </span>
          )}
          {employee.cardNumber && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <CreditCard className="w-3 h-3 shrink-0" />
              {employee.bankName} {maskCard(employee.cardNumber)}
            </span>
          )}
        </div>
      </div>

      {/* Salary */}
      <div className="text-right shrink-0">
        <p className="text-sm font-bold text-foreground">{formatRub(employee.salaryRate)}</p>
        <p className="text-xs text-muted-foreground">ставка</p>
      </div>
    </button>
  )
}
