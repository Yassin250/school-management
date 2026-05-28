import { SessionProvider } from "@/component/provider";
import Menu from "@/component/Menu";
import Navbar from "@/component/Navbar";
import { Toaster } from "sonner";
import Image from "next/image";
import Link from "next/link";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SessionProvider>
       <Toaster position="top-right" richColors />
      <div className="h-screen flex bg-gray-100">
        
        {/* LEFT SIDEBAR */}
        <div className="w-[14%] md:w-[8%] lg:w-[16%] xl:w-[14%] bg-white border-r border-gray-200 p-4 flex flex-col">
          <Link
            href="/"
            className="flex items-center justify-center lg:justify-start gap-2 mb-6"
          >
            <Image
              src="/1.png"
              alt="logo"
              width={32}
              height={32}
              className="w-auto h-auto"
            />

            <span className="hidden lg:block font-bold text-gray-800">
              SchoolSMS
            </span>
          </Link>

          <Menu />
        </div>

        {/* RIGHT CONTENT */}
        <div className="w-[86%] md:w-[92%] lg:w-[84%] xl:w-[86%] bg-gray-50 overflow-y-auto flex flex-col min-w-0">
          <Navbar />

          <div className="flex-1 p-6 min-w-0">
            {children}
          </div>
        </div>
      </div>
    </SessionProvider>
  );
}