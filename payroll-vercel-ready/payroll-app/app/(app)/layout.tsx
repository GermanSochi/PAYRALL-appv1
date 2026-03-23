import { BottomNav } from "@/components/bottom-nav"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main
        className="flex-1 overflow-y-auto"
        style={{ paddingBottom: "var(--nav-height)" }}
      >
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
