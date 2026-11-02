"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Профиль", href: "/profile" },
  { name: "Мои бронирования", href: "/bookings" },
  { name: "Чаты", href: "/chats" },
  { name: "Избранное", href: "/favorites" },
  { name: "Мои отзывы", href: "/reviews" },
  { name: "Промокоды", href: "/promocodes" },
  { name: "Уведомления", href: "/notifications" },
  { name: "Настройки", href: "/settings" },
];

export function ClientSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 shrink-0">
      <nav className="space-y-1">
        {navigation.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "block rounded-lg px-3 py-2 text-sm transition-colors",
              pathname === item.href
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted"
            )}
          >
            {item.name}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
