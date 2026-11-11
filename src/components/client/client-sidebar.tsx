"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Дашборд", href: "/client" },
  { name: "Мои бронирования", href: "/client/bookings" },
  { name: "Платежи", href: "/client/payments" },
  { name: "Чаты", href: "/client/chats" },
  { name: "Избранное", href: "/client/favorites" },
  { name: "Мои отзывы", href: "/client/reviews" },
  { name: "Промокоды", href: "/client/promocodes" },
  { name: "Бонусы", href: "/client/loyalty" },
  { name: "Уведомления", href: "/client/notifications" },
  { name: "Поддержка", href: "/client/support" },
  { name: "Профиль", href: "/client/profile" },
  { name: "Настройки", href: "/client/settings" },
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
