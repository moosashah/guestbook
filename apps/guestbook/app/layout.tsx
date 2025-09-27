import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"] });

import type { Viewport } from "next";
import { auth, logout } from "./actions";
import { Button } from "@/components/ui/button";
import { headers } from "next/headers";

export const viewport: Viewport = {
  themeColor: "white",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Wedding Memories",
  description: "Collect and cherish wedding memories from your guests",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const subject = await auth();
  const headersList = await headers();
  const pathname = headersList.get('x-pathname') || '';

  // Check if current path should hide header
  const shouldHideHeader = pathname.startsWith('/guest') || pathname.startsWith('/login');

  return (
    <html lang="en" className="bg-white">
      <body className={cn(inter.className, "bg-white")}>
        {/* User Info Display */}
        {subject && !shouldHideHeader ? (
          <div className="mb-6 p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-4">
              <img
                src={subject.properties.picture}
                alt={subject.properties.name}
                className="w-12 h-12 rounded-full"
              />
              <div className="flex-1">
                <h2 className="text-lg font-semibold">{subject.properties.name}</h2>
                <p className="text-sm text-muted-foreground">{subject.properties.email}</p>
                <p className="text-xs text-muted-foreground">ID: {subject.properties.id}</p>
              </div>
              <form action={logout}>
                <Button variant="outline" size="sm">
                  Logout
                </Button>
              </form>
            </div>
          </div>
        ) : null}
        {children}
        <Toaster />
      </body>
    </html>
  );
}
