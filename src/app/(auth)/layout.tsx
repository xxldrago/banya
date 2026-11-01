import Link from "next/link";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {children}
        <p className="text-center text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground hover:underline">
            ← На главную
          </Link>
        </p>
      </div>
    </div>
  );
}
