import { GuessTheSongGame } from "@/features/guess-the-song/GuessTheSongGame";

export const metadata = {
  title: "Guess the Telugu Song",
  description: "Uncover a Telugu song title letter by letter, using the movie, year and composer as clues.",
};

export default function GuessTheSongPage() {
  return <GuessTheSongGame />;
}
