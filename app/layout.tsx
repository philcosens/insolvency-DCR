import type { Metadata } from "next";
import "./stylesheets/govuk-frontend.min.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Director Conduct Reporting Service",
  description: "Submit information for a director conduct report.",
  icons: { icon: "/assets/images/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
