"use client"

import { useState, useMemo } from "react"
import { useStore, type Employee } from "@/lib/store"
import { EmployeeCard } from "@/components/employee-card"
import { EmployeeDetailModal } from "@/components/employee-detail-modal"
import { EmployeeForm } from "@/components/employee-form"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Plus, Users, UserX } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { nanoid } from "nanoid"

type Filter = "active" | "fired"

export default function EmployeesPage() {
  const { employees, addEmployee } = useStore()
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<Filter>("active")
  const [selected, setSelected] = useState<Employee | null>(null)
  const [adding, setAdding] = useState(false)

  const filtered = useMemo(() => {
    return employees
      .filter((e) => e.status === filter)
      .filter((e) => {
        if (!search) return true
        const q = search.toLowerCase()
        return e.name.toLowerCase().includes(q) || e.phone.includes(q)
      })
      .sort((a, b) => a.name.localeCompare(b.name, "ru"))
  }, [employees, filter, search])

  const handleAdd = (data: {
    name: string
    phone?: string
    bankName: string
    cardNumber?: string
    position: string
    salaryRate: number
    hireDate: string
  }) => {
    const newEmp: Employee = {
      id: nanoid(),
      name: data.name,
      phone: data.phone ?? "",
      bankName: data.bankName,
      cardNumber: data.cardNumber ?? "",
      position: data.position,
      salaryRate: data.salaryRate,
      hireDate: data.hireDate,
      status: "active",
    }
    addEmployee(newEmp)
    toast.success(`${data.name} добавлен в штат`)
    setAdding(false)
  }

  const activeCount = employees.filter((e) => e.status === "active").length
  const firedCount = employees.filter((e) => e.status === "fired").length

  return (
    <div className="px-4 pt-5 pb-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold">Сотрудники</h1>
          <p className="text-sm text-muted-foreground">
            {activeCount} активных · {firedCount} уволенных
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск по имени или телефону…"
          className="pl-9"
        />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4">
        <FilterTab
          active={filter === "active"}
          icon={<Users className="w-4 h-4" />}
          label={`Активные (${activeCount})`}
          onClick={() => setFilter("active")}
        />
        <FilterTab
          active={filter === "fired"}
          icon={<UserX className="w-4 h-4" />}
          label={`Уволенные (${firedCount})`}
          onClick={() => setFilter("fired")}
        />
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">
            {search ? "Никого не найдено" : "Список пуст"}
          </p>
        </div>
      ) : (
        <div className="space-y-2 pb-4">
          {filtered.map((emp) => (
            <EmployeeCard
              key={emp.id}
              employee={emp}
              onClick={() => setSelected(emp)}
            />
          ))}
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setAdding(true)}
        className="fixed bottom-[calc(var(--nav-height)+1rem)] right-4 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center hover:bg-primary/90 active:scale-95 transition-transform z-40"
        aria-label="Добавить сотрудника"
      >
        <Plus className="w-6 h-6" strokeWidth={2.5} />
      </button>

      {/* Detail modal */}
      <EmployeeDetailModal
        employee={selected}
        open={!!selected}
        onClose={() => setSelected(null)}
      />

      {/* Add modal */}
      <Dialog open={adding} onOpenChange={(v) => !v && setAdding(false)}>
        <DialogContent className="max-w-md w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Новый сотрудник</DialogTitle>
          </DialogHeader>
          <EmployeeForm onSubmit={handleAdd} onCancel={() => setAdding(false)} />
        </DialogContent>
      </Dialog>
    </div>
  )
}

function FilterTab({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean
  icon: React.ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "bg-secondary text-muted-foreground hover:text-foreground"
      )}
    >
      {icon}
      {label}
    </button>
  )
}
