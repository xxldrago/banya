"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type NavItem = { name: string; href: string };
type NavGroup = { title: string; items: NavItem[] };

const navigation: NavGroup[] = [
  { title: "Обзор", items: [{ name: "Дашборд", href: "/admin" }] },
  {
    title: "Пользователи",
    items: [
      { name: "Пользователи", href: "/admin/users" },
      { name: "Партнёры", href: "/admin/partners" },
      { name: "Сотрудники", href: "/admin/staff" },
    ],
  },
  {
    title: "Каталог",
    items: [
      { name: "Объекты", href: "/admin/venues" },
      { name: "Медиа", href: "/admin/media" },
      { name: "Контент", href: "/admin/content" },
      { name: "Справочники", href: "/admin/refs" },
    ],
  },
  {
    title: "Операции",
    items: [
      { name: "Бронирования", href: "/admin/bookings" },
      { name: "Платежи", href: "/admin/payments" },
      { name: "Возвраты", href: "/admin/refunds" },
      { name: "Чат", href: "/admin/chat" },
      { name: "Поддержка", href: "/admin/support" },
      { name: "Сертификаты", href: "/admin/gift-certificates" },
    ],
  },
  {
    title: "Модерация",
    items: [
      { name: "Отзывы", href: "/admin/reviews" },
      { name: "Промокоды", href: "/admin/promocodes" },
      { name: "Реклама", href: "/admin/ads" },
      { name: "Антифрод", href: "/admin/fraud" },
    ],
  },
  {
    title: "Система",
    items: [
      { name: "Аудит", href: "/admin/audit" },
      { name: "Уведомления", href: "/admin/notifications" },
      { name: "Настройки", href: "/admin/settings" },
      { name: "Безопасность (2FA)", href: "/admin/security" },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 shrink-0">
      <nav className="space-y-4">
        {navigation.map((group) => (
          <div key={group.title}>
            <div className="px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {group.title}
            </div>
            <div className="space-y-1">
              {group.items.map((item) => (
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
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
