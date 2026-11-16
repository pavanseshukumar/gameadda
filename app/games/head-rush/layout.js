import { PageTheme } from "@/components/game/PageTheme";

export const viewport = {
  themeColor: "#fff0e4",
};

/** Wraps every screen of the game in its theme (tokens live in app/game-themes.css). */
export default function Layout({ children }) {
  return (
    <div className="game-theme theme-carnival flex min-h-dvh flex-1 flex-col">
      <PageTheme name="carnival" />
      {children}
    </div>
  );
}
