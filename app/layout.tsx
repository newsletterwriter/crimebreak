import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Crime Break", template: "%s | Crime Break" },
  description: "Real crime. Real consequences. Real time.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Crime Break",
  },
  openGraph: {
    siteName: "Crime Break",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#1B2B4A",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="mobile-web-app-capable" content="yes" />
        {process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID && (
          <script
            src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js"
            defer
          />
        )}
        {process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID && (
          <script
            dangerouslySetInnerHTML={{
              __html: `window.OneSignalDeferred = window.OneSignalDeferred || [];
OneSignalDeferred.push(async function(OneSignal) {
  await OneSignal.init({
    appId: "${process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID}",
    serviceWorkerPath: "/sw.js",
    serviceWorkerParam: { scope: "/" },
    notifyButton: { enable: false },
    allowLocalhostAsSecureOrigin: true,
  });
});`,
            }}
          />
        )}
      </head>
      <body className="h-full bg-white">{children}</body>
    </html>
  );
}
