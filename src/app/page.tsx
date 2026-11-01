import { CitySelector } from "@/components/city-selector";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:py-20">
      <section className="space-y-8 text-center">
        <div className="space-y-4">
          <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
            Найдите идеальную баню или сауну
          </h1>
          <p className="mx-auto max-w-2xl text-base text-muted-foreground sm:text-lg">
            Выберите город — и мы покажем проверенные объекты с фото, удобствами
            и правилами. Бронирование онлайн за несколько кликов.
          </p>
        </div>
        <CitySelector />
      </section>
    </div>
  );
}
