import { Figtree } from "next/font/google";
import { PageTheme } from "@/components/game/PageTheme";

const sans = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata = {
  title: {
    default: "Pictionary Party",
    template: "%s · Pictionary Party",
  },
  description: "The board, dice, cards, timer and scorekeeper for your in-person drawing game night.",
};

export const viewport = {
  themeColor: "#fbf5ea",
  viewportFit: "cover",
};

/** Pictionary Party keeps its own light paper look; styles live in features/pictionary/pictionary.css. */
export default function PictionaryLayout({ children }) {
  return (
    <div className={`pictionary ${sans.variable} flex min-h-dvh flex-1 flex-col`}>
      <PageTheme name="pictionary" />
      {children}
    </div>
  );
}
