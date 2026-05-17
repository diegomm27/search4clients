import Link from "next/link";
import { Home, Search, Settings, Users } from "lucide-react";

const nav = [
  { href: "/", label: "Home", icon: Home },
  { href: "/searches/new", label: "Find clients", icon: Search },
  { href: "/leads", label: "Potential clients", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-pine text-sm font-semibold text-white">s4c</span>
            <span>
              <span className="block text-lg font-semibold">search4clients</span>
              <span className="block text-xs text-moss">AI research, human review</span>
            </span>
          </Link>
          <nav className="flex flex-wrap items-center gap-1">
            {nav.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="focus-ring inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm text-ink hover:bg-paper"
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
}
