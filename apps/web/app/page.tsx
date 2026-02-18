import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <div className="h-screen bg-white p-4 font-sans flex flex-col">
      <main className="w-full flex-1 rounded-xl bg-green-900 shadow-lg"></main>
      <div className="mt-4 flex px-4 items-center justify-between">
        <Image
          src="/logo.png"
          alt="Logo"
          width={80}
          height={80}
          className="h-10 w-auto shrink-0 object-contain"
        />

        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="rounded border border-green-900 px-4 py-2 text-green-900"
          >
            Login
          </Link>

          <Link
            href="/register"
            className="rounded bg-green-900 px-4 py-2 text-white"
          >
            Register
          </Link>
        </div>
      </div>
    </div>
  );
}
