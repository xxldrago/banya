"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function ViewToggle({ current }: { current: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function toggle(next: "list" | "map") {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "list") params.delete("view");
    else params.set("view", next);
    router.replace(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex rounded-md border">
      <button
        type="button"
        onClick={() => toggle("list")}
        className={`px-3 py-1.5 text-sm ${current === "list" ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}
      >
        Список
      </button>
      <button
        type="button"
        onClick={() => toggle("map")}
        className={`px-3 py-1.5 text-sm ${current === "map" ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}
      >
        Карта
      </button>
    </div>
  );
}
