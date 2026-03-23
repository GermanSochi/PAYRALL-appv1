"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Users, Wallet, BarChart3 } from "lucide-react"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { href: "/", label: "Главная", icon: Home },
  { href: "/employees", label: "Сотрудники", icon: Users },
  { href: "/payroll", label: "Зарплата", icon: Wallet },
  { href: "/stats", label: "Статистика", icon: BarChart3 },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border"
      style={{ height: "var(--nav-height)" }}
      aria-label="Основная навигация"
    >
      <ul className="flex h-full items-stretch">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href)
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 h-full w-full text-xs transition-colors",
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon
                  className={cn("w-5 h-5 transition-transform", active && "scale-110")}
                  strokeWidth={active ? 2.5 : 1.8}
                />
                <span className={cn("font-medium", active && "font-semibold")}>{label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
