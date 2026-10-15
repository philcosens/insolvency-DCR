import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Director's Conduct Report",
  description: "Submit information for a director conduct report.",
  icons: { icon: "/assets/images/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="/stylesheets/govuk-frontend.min.css" />
      </head>
      <body className="govuk-template__body">{children}</body>
      <script src="/javascripts/dcrs-dictation.js" defer />
    </html>
  );
}
