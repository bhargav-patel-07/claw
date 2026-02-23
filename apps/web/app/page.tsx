import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import Ai04 from "@/components/homeaiInput";
import GitButton from "@/components/ui/github";

export default function Home() {
  return (
    <div className="h-screen bg-white p-4 font-sans flex flex-col">
      <main className="w-full flex-1 rounded-xl bg-green-900 shadow-lg">
        <div className="absolute top-8 right-8 bg-white border border-gray-200 rounded-full pt-2">
          <Link href="https://github.com/bhargav-patel-07">
             <GitButton />
          </Link>
        </div>
        <div className="flex h-full flex-col items-center justify-center gap-6"><Ai04 /></div>
      </main>

      <div className="mt-4 flex px-4 items-center justify-between">
        <Image
          src="/logo.png"
          alt="Logo"
          width={80}
          height={80}
          className="h-10 w-auto shrink-0 object-contain"
        />

        <div className="flex items-center gap-4">
          <Button
            asChild
            variant="outline"
            className="border-green-900 text-green-900 hover:bg-green-50"
          >
            <Link href="/login">Login</Link>
          </Button>

          <Button
            asChild
            className="bg-green-900 text-white hover:bg-green-800"
          >
            <Link href="/register">Register</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
