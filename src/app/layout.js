import "./globals.css";

export const metadata = {
  title: {
    default: "TTFS Report Assistant",
    template: "%s | TTFS Report Assistant"
  },
  description: "Mobile-friendly assistant for TTFS reports plus customer photo and location logging.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/photo-log-icon.svg",
    apple: "/photo-log-icon.svg"
  },
  appleWebApp: {
    capable: true,
    title: "Photo Log",
    statusBarStyle: "default"
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
