import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Povezani. — Internet in družbena omrežja v Sloveniji",
  description:
    "Interaktivni pregled podatkov SURS o uporabi interneta in družbenih omrežij v Sloveniji. Vaja 3, odprti podatki PC-Axis.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="sl">
      <body>
        <a className="skip-link" href="#raziskuj">
          Preskoči na vsebino
        </a>
        {children}
      </body>
    </html>
  );
}
