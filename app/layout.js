import { Baloo_2, Bricolage_Grotesque, Fraunces, Geist, Geist_Mono, Oswald, Chakra_Petch, Kalam, Lilita_One, Space_Grotesk, Fredoka, Space_Mono, Unbounded, Zilla_Slab } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const display = Bricolage_Grotesque({
  variable: "--font-display-face",
  subsets: ["latin"],
});

// Each game's display face (see app/game-themes.css). Not preloaded: a file only
// downloads on the pages whose theme uses it.
const songbook = Fraunces({ variable: "--font-songbook", subsets: ["latin"], preload: false });
const tabletop = Baloo_2({ variable: "--font-tabletop", subsets: ["latin"], preload: false });
const marquee = Oswald({ variable: "--font-marquee", subsets: ["latin"], preload: false });
const thermal = Space_Grotesk({ variable: "--font-thermal", subsets: ["latin"], preload: false });
const dial = Unbounded({ variable: "--font-dial", subsets: ["latin"], preload: false });
const hideout = Chakra_Petch({ variable: "--font-hideout", subsets: ["latin"], weight: ["500", "600", "700"], preload: false });
const chalkboard = Kalam({ variable: "--font-chalkboard", subsets: ["latin"], weight: ["400", "700"], preload: false });
const listings = Zilla_Slab({ variable: "--font-listings", subsets: ["latin"], weight: ["500", "700"], preload: false });
const frost = Fredoka({ variable: "--font-frost", subsets: ["latin"], weight: ["500", "600", "700"], preload: false });
const arcade = Space_Mono({ variable: "--font-arcade", subsets: ["latin"], weight: ["400", "700"], preload: false });
const carnival = Lilita_One({ variable: "--font-carnival", subsets: ["latin"], weight: "400", preload: false });
const gameFonts = [songbook, tabletop, marquee, thermal, dial, hideout, chalkboard, listings, frost, arcade, carnival];

export const metadata = {
  title: {
    default: "GameAdda · Party games for one screen",
    template: "%s · GameAdda",
  },
  description: "Local multiplayer party games. Gather round one device and play together.",
};

export const viewport = {
  themeColor: "#eeeafb",
  // Lets pages draw under the notch / home bar; GameShell pads with env(safe-area-inset-*).
  viewportFit: "cover",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${display.variable} ${gameFonts.map((font) => font.variable).join(" ")} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
