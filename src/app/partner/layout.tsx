import type { Metadata } from "next";
import { PartnerSidebar } from "@/components/partner/partner-sidebar";

export const metadata: Metadata = {
  title: "Кабинет партнёра — Баня.Сауна",
};

export default function PartnerLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="mx-auto flex max-w-6xl gap-6 px-4 py-6">
      <PartnerSidebar />
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
