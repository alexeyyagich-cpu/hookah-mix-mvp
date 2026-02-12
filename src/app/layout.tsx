import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/lib/ThemeContext";
import { AuthProvider } from "@/lib/AuthContext";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "Hookah Torus | Калькулятор миксов и управление кальянной",
    template: "%s | Hookah Torus",
  },
  description: "Создавайте идеальные миксы табака с AI-рекомендациями. Управляйте инвентарём, отслеживайте сессии и радуйте гостей. Полная платформа для кальянных заведений.",
  keywords: [
    "кальянный калькулятор",
    "миксы табака",
    "hookah mix calculator",
    "управление кальянной",
    "инвентарь табака",
    "AI рекомендации миксов",
    "кальянный бизнес",
    "lounge management",
  ],
  authors: [{ name: "Hookah Torus" }],
  creator: "Hookah Torus",
  publisher: "Hookah Torus",
  metadataBase: new URL("https://hookah-torus.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: "https://hookah-torus.com",
    siteName: "Hookah Torus",
    title: "Hookah Torus — Калькулятор миксов и управление кальянной",
    description: "Создавайте идеальные миксы табака с AI-рекомендациями. Полная платформа для кальянных заведений.",
    // images auto-generated from opengraph-image.tsx
  },
  twitter: {
    card: "summary_large_image",
    title: "Hookah Torus — Калькулятор миксов",
    description: "Создавайте идеальные миксы табака с AI-рекомендациями",
    // images auto-generated from twitter-image.tsx
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // google: "your-google-verification-code",
    // yandex: "your-yandex-verification-code",
  },
};

// JSON-LD Structured Data
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://hookah-torus.com/#website",
      url: "https://hookah-torus.com",
      name: "Hookah Torus",
      description: "Калькулятор миксов и платформа управления кальянной",
      publisher: {
        "@id": "https://hookah-torus.com/#organization",
      },
    },
    {
      "@type": "Organization",
      "@id": "https://hookah-torus.com/#organization",
      name: "Hookah Torus",
      url: "https://hookah-torus.com",
      logo: {
        "@type": "ImageObject",
        url: "https://hookah-torus.com/images/logo.png",
        width: 512,
        height: 512,
      },
      contactPoint: {
        "@type": "ContactPoint",
        email: "support@hookah-mix.com",
        contactType: "customer support",
      },
    },
    {
      "@type": "SoftwareApplication",
      "@id": "https://hookah-torus.com/#app",
      name: "Hookah Torus",
      description: "AI-powered hookah mix calculator and lounge management platform",
      url: "https://hookah-torus.com",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "EUR",
        description: "Free tier available",
      },
      featureList: [
        "Mix Calculator",
        "AI Recommendations",
        "Inventory Management",
        "Session Tracking",
        "Guest Preferences",
        "Statistics & Analytics",
      ],
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#F59E0B" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <AuthProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
