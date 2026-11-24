import { PageTheme } from "@/components/game/PageTheme";

export const viewport = {
  themeColor: "#e8f1ea",
};

/** Wraps every screen of the game in its theme (tokens live in app/game-themes.css). */
export default function Layout({ children }) {
  return (
    // overflow-x-clip: whatever a screen holds (fanned cards, a BUSTED stamp), the page never scrolls sideways.
    <div className="game-theme theme-felt flex min-h-dvh flex-1 flex-col overflow-x-clip">
      <PageTheme name="felt" />
      {children}
    </div>
  );
}
