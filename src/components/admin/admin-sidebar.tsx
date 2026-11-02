"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Дашборд", href: "/admin" },
  { name: "Пользователи", href: "/admin/users" },
  { name: "Объекты", href: "/admin/venues" },
  { name: "Бронирования", href: "/admin/bookings" },
  { name: "Отзывы", href: "/admin/reviews" },
  { name: "Платежи", href: "/admin/payments" },
  { name: "Промокоды", href: "/admin/promocodes" },
  { name: "Чат", href: "/admin/chat" },
  { name: "Настройки", href: "/admin/settings" },
];

export function AdminSidebar() {
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
