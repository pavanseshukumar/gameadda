import { Baloo_2, Bricolage_Grotesque, Fraunces, Geist, Geist_Mono, Oswald, Chakra_Petch, Space_Grotesk, Unbounded } from "next/font/google";
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
const gameFonts = [songbook, tabletop, marquee, thermal, dial, hideout];

export const metadata = {
  title: {
    default: "GameAdda · Party games for one screen",
    template: "%s · GameAdda",
  },
  description: "Local multiplayer party games. Gather round one device and play together.",
};

export const viewport = {
  themeColor: "#07070c",
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
