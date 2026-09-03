import type { Metadata } from "next";
import { Space_Grotesk, IBM_Plex_Sans_Hebrew, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const display = Space_Grotesk({
    subsets: ["latin"],
    weight: ["500", "700"],
    variable: "--font-display"
});

const body = IBM_Plex_Sans_Hebrew({
    subsets: ["hebrew", "latin"],
    weight: ["400", "500", "600"],
    variable: "--font-body"
});

const mono = JetBrains_Mono({
    subsets: ["latin"],
    weight: ["400", "500", "600"],
    variable: "--font-mono"
});

export const metadata: Metadata = {
    title: "devops-hub",
    description: "שאלון AI שמייצר תוכנית פרויקט, סקאפולד ו-workflow ל-n8n"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="he" dir="rtl" className={`${display.variable} ${body.variable} ${mono.variable}`}>
            <body>
                <div className="topbar">
                    <div className="brand">
                        <span className="glyph">▸</span>
                        <span>devops-hub</span>
                    </div>
                    <div className="status-pill">
                        <span className="status-dot" />
                        <span>3 agents ready</span>
                    </div>
                </div>
                {children}
            </body>
        </html>
    );
}
