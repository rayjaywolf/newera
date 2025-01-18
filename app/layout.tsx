import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const aeonikProBold = localFont({
  src: "./fonts/AeonikProTRIAL-Bold.otf",
  variable: "--font-aeonik-pro-bold",
  weight: "700",
});

const aeonikProLight = localFont({
  src: "./fonts/AeonikProTRIAL-Light.otf",
  variable: "--font-aeonik-pro-light",
  weight: "300",
});

const aeonikProRegular = localFont({
  src: "./fonts/AeonikProTRIAL-Regular.otf",
  variable: "--font-aeonik-pro-regular",
  weight: "400",
});

export const metadata: Metadata = {
  title: "New Era Construction",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${aeonikProRegular.variable} antialiased bg-primary-bg`}
      >
        {children}
      </body>
    </html>
  );
}
