"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { BANKS, POSITIONS } from "@/lib/helpers"
import type { Employee } from "@/lib/store"

const schema = z.object({
  name: z.string().min(2, "Введите ФИО"),
  phone: z.string().optional(),
  bankName: z.string().min(1, "Выберите банк"),
  cardNumber: z
    .string()
    .regex(/^\d{16}$/, "Введите 16 цифр карты")
    .optional()
    .or(z.literal("")),
  position: z.string().min(1, "Введите должность"),
  salaryRate: z.coerce.number().min(1, "Укажите ставку"),
  hireDate: z.string().min(1, "Укажите дату"),
})

type FormValues = z.infer<typeof schema>

interface EmployeeFormProps {
  defaultValues?: Partial<Employee>
  onSubmit: (data: FormValues) => void
  onCancel: () => void
  loading?: boolean
}

export function EmployeeForm({
  defaultValues,
  onSubmit,
  onCancel,
  loading,
}: EmployeeFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      phone: defaultValues?.phone ?? "",
      bankName: defaultValues?.bankName ?? "",
      cardNumber: defaultValues?.cardNumber ?? "",
      position: defaultValues?.position ?? "",
      salaryRate: defaultValues?.salaryRate ?? 0,
      hireDate: defaultValues?.hireDate ?? new Date().toISOString().slice(0, 10),
    },
  })

  const bankName = watch("bankName")
  const position = watch("position")

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* ФИО */}
      <div className="space-y-1.5">
        <Label htmlFor="name">ФИО *</Label>
        <Input id="name" placeholder="Иванов Иван Иванович" {...register("name")} />
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </div>

      {/* Телефон */}
      <div className="space-y-1.5">
        <Label htmlFor="phone">Телефон</Label>
        <Input id="phone" type="tel" placeholder="+7 999 000 0000" {...register("phone")} />
      </div>

      {/* Должность */}
      <div className="space-y-1.5">
        <Label>Должность *</Label>
        <Select
          value={position}
          onValueChange={(v) => setValue("position", v, { shouldValidate: true })}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Выберите должность" />
          </SelectTrigger>
          <SelectContent>
            {POSITIONS.map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.position && (
          <p className="text-xs text-destructive">{errors.position.message}</p>
        )}
      </div>

      {/* Банк */}
      <div className="space-y-1.5">
        <Label>Банк *</Label>
        <Select
          value={bankName}
          onValueChange={(v) => setValue("bankName", v, { shouldValidate: true })}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Выберите банк" />
          </SelectTrigger>
          <SelectContent>
            {BANKS.map((b) => (
              <SelectItem key={b} value={b}>
                {b}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.bankName && (
          <p className="text-xs text-destructive">{errors.bankName.message}</p>
        )}
      </div>

      {/* Номер карты */}
      <div className="space-y-1.5">
        <Label htmlFor="cardNumber">Номер карты (16 цифр)</Label>
        <Input
          id="cardNumber"
          placeholder="0000000000000000"
          maxLength={16}
          inputMode="numeric"
          {...register("cardNumber")}
        />
        {errors.cardNumber && (
          <p className="text-xs text-destructive">{errors.cardNumber.message}</p>
        )}
      </div>

      {/* Ставка */}
      <div className="space-y-1.5">
        <Label htmlFor="salaryRate">Ставка (₽/мес) *</Label>
        <Input
          id="salaryRate"
          type="number"
          min={0}
          placeholder="50000"
          {...register("salaryRate")}
        />
        {errors.salaryRate && (
          <p className="text-xs text-destructive">{errors.salaryRate.message}</p>
        )}
      </div>

      {/* Дата приёма */}
      <div className="space-y-1.5">
        <Label htmlFor="hireDate">Дата приёма *</Label>
        <Input id="hireDate" type="date" {...register("hireDate")} />
        {errors.hireDate && (
          <p className="text-xs text-destructive">{errors.hireDate.message}</p>
        )}
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Отмена
        </Button>
        <Button type="submit" className="flex-1" disabled={loading}>
          {loading ? "Сохраняю…" : "Сохранить"}
        </Button>
      </div>
    </form>
  )
}
