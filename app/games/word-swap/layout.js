import { PageTheme } from "@/components/game/PageTheme";

export const viewport = {
  themeColor: "#ece9fb",
};

/** Wraps every screen of the game in its theme (tokens live in app/game-themes.css). */
export default function Layout({ children }) {
  return (
    <div className="game-theme theme-arcade flex min-h-dvh flex-1 flex-col">
      <PageTheme name="arcade" />
      {children}
    </div>
  );
}
