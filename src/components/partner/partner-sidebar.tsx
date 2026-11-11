"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type NavItem = { name: string; href: string };
type NavGroup = { title: string; items: NavItem[] };

const navigation: NavGroup[] = [
  {
    title: "Обзор",
    items: [{ name: "Дашборд", href: "/partner" }],
  },
  {
    title: "Операции",
    items: [
      { name: "Бронирования", href: "/partner/bookings" },
      { name: "Календарь", href: "/partner/calendar" },
      { name: "Чаты", href: "/partner/chats" },
      { name: "Лист ожидания", href: "/partner/waitlist" },
    ],
  },
  {
    title: "Каталог",
    items: [
      { name: "Объекты", href: "/partner/venues" },
      { name: "Тарифы", href: "/partner/tariffs" },
      { name: "Услуги", href: "/partner/services" },
      { name: "Медиа", href: "/partner/media" },
    ],
  },
  {
    title: "Маркетинг",
    items: [
      { name: "Промокоды", href: "/partner/promocodes" },
      { name: "Сертификаты", href: "/partner/certificates" },
      { name: "Реклама", href: "/partner/ads" },
    ],
  },
  {
    title: "Клиенты",
    items: [
      { name: "Клиенты", href: "/partner/clients" },
      { name: "Отзывы", href: "/partner/reviews" },
      { name: "Поддержка", href: "/partner/support" },
    ],
  },
  {
    title: "Финансы",
    items: [
      { name: "Финансы", href: "/partner/finance" },
      { name: "Аналитика", href: "/partner/analytics" },
      { name: "Выплаты", href: "/partner/payouts" },
    ],
  },
  {
    title: "Настройки",
    items: [
      { name: "Уведомления", href: "/partner/notifications" },
      { name: "Сотрудники", href: "/partner/staff" },
      { name: "Верификация", href: "/partner/verify" },
      { name: "Аудит", href: "/partner/audit" },
      { name: "Профиль", href: "/partner/profile" },
    ],
  },
];

export function PartnerSidebar() {
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
