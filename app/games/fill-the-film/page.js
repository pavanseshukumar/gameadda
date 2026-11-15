import { FillTheFilmGame } from "@/features/fill-the-film/FillTheFilmGame";

export const metadata = {
  title: "Fill the Film",
  description: "Every team gets a list of Telugu movie titles as blanks. Fill them in, ask for letters or clues, and score the most.",
};

export default function FillTheFilmPage() {
  return <FillTheFilmGame />;
}
