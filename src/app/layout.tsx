import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { GameStateProvider } from "@/game/GameStateProvider";
import NavBar from "@/components/NavBar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Stock Simulator",
  description: "Learn Indian Stock Market Fundamental Analysis",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.className} bg-slate-950 text-slate-100 min-h-screen flex flex-col`}
      >
        <GameStateProvider>
          <NavBar />
          <main className="flex-1 p-4 md:p-8 max-w-6xl w-full mx-auto">
            {children}
          </main>
        </GameStateProvider>
      </body>
    </html>
  );
}
