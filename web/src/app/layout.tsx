import type { Metadata, Viewport } from "next";
import { Atkinson_Hyperlegible_Next, Noto_Sans_Devanagari } from "next/font/google";
import { AppShell } from "@/components/AppShell";
import { AppStateProvider } from "@/components/AppState";
import "./globals.css";

// Atkinson Hyperlegible was designed by the Braille Institute for low-vision readers.
const atkinson = Atkinson_Hyperlegible_Next({ variable: "--font-atkinson", subsets: ["latin", "latin-ext"] });
const devanagari = Noto_Sans_Devanagari({ variable: "--font-devanagari", subsets: ["devanagari"] });

export const metadata: Metadata = {
  title: "Rooted",
  description: "Financial education adapted to your country, language and stage of life.",
};

export const viewport: Viewport = {
  themeColor: "#f2f3f0",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${atkinson.variable} ${devanagari.variable} antialiased`}>
      <body className="min-h-dvh" suppressHydrationWarning>
        {/* Paint the saved country's line colour before hydration, so the header never flashes. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var s=JSON.parse(localStorage.getItem("rooted:v1"));if(s&&s.profile)document.body.dataset.region=s.profile.regionId}catch(e){}`,
          }}
        />
        <AppStateProvider>
          <AppShell>{children}</AppShell>
        </AppStateProvider>
      </body>
    </html>
  );
}
