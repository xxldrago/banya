import type { Metadata } from "next";
import { ClientSidebar } from "@/components/client/client-sidebar";

export const metadata: Metadata = {
  title: "Личный кабинет — Баня.Сауна",
};

export default function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="mx-auto flex max-w-6xl gap-6 px-4 py-6">
      <ClientSidebar />
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
