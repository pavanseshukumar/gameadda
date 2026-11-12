import { GuessTheSongGame } from "@/features/guess-the-song/GuessTheSongGame";

export const metadata = {
  title: "Guess the Telugu Song",
  description: "Crack transliterated Telugu lyrics letter by letter, then name that song.",
};

export default function GuessTheSongPage() {
  return <GuessTheSongGame />;
}
