import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { BookingProvider } from "@/lib/context/booking-context";
import { AuthProvider } from "@/lib/context/auth-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sabari - Book Vehicle Tickets Online in Nepal | Nepal's #1 Booking Platform",
  description: "Book bus, hiace, sumo, jeep, and EV tickets across Nepal. Safe, secure, and reliable vehicle booking platform covering major routes across Nepal.",
  keywords: "bus tickets Nepal, online bus booking Nepal, book bus tickets online, Nepal bus booking, Sabari, Kathmandu to Pokhara bus, vehicle booking platform Nepal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-zinc-900">
        <AuthProvider>
          <BookingProvider>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </BookingProvider>
        </AuthProvider>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
