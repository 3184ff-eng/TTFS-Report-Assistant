import "./globals.css";

export const metadata = {
  title: {
    default: "Fire Investigation Process Guide",
    template: "%s | Fire Investigation Process Guide"
  },
  description: "Mobile-friendly guided workflow for fire investigation process management.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/photo-log-icon.svg",
    apple: "/photo-log-icon.svg"
  },
  appleWebApp: {
    capable: true,
    title: "Fire Investigation",
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
