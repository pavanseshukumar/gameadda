import { PageTheme } from "@/components/game/PageTheme";

export const viewport = {
  themeColor: "#e6f0fb",
};

/** Wraps every screen of the game in its theme (tokens live in app/game-themes.css). */
export default function Layout({ children }) {
  return (
    <div className="game-theme theme-thermal flex min-h-dvh flex-1 flex-col">
      <PageTheme name="thermal" />
      {children}
    </div>
  );
}
