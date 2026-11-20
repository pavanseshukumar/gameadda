import { PageTheme } from "@/components/game/PageTheme";

export const viewport = {
  themeColor: "#e8f1ea",
};

/** Wraps every screen of the game in its theme (tokens live in app/game-themes.css). */
export default function Layout({ children }) {
  return (
    <div className="game-theme theme-felt flex min-h-dvh flex-1 flex-col">
      <PageTheme name="felt" />
      {children}
    </div>
  );
}
