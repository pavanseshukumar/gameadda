import { HangmanGame } from "@/features/hangman/HangmanGame";

export const metadata = {
  title: "Hangman",
  description: "Every team gets its own hidden word. Call letters and solve it before six misses finish the stick figure.",
};

export default function HangmanPage() {
  return <HangmanGame />;
}
