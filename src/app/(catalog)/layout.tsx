import Link from "next/link";
import { cookies } from "next/headers";
import { prisma } from "@/shared/db/client";

export default async function CatalogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const cityId = cookieStore.get("cityId")?.value;
  let cityName: string | null = null;

  if (cityId) {
    const city = await prisma.city.findUnique({
      where: { id: cityId },
      select: { name: true },
    });
    cityName = city?.name ?? null;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Каталог</p>
          <h2 className="text-xl font-semibold">
            {cityName ? `Город: ${cityName}` : "Выберите город"}
          </h2>
        </div>
        <Link
          href="/"
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          Сменить город
        </Link>
      </div>
      {children}
    </div>
  );
}
