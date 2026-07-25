import "./globals.css";

export const metadata = {
  title: "TTFS Report Assistant",
  description: "Mobile-friendly assistant for drafting and vetting TTFS fire reports"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
