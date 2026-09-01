import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "DevOps Hub",
    description: "שאלון AI שמייצר תוכנית פרויקט, סקאפולד ו-workflow ל-n8n"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="he" dir="rtl">
            <body>{children}</body>
        </html>
    );
}
