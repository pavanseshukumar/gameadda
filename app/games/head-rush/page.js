import { HeadRushGame } from "@/features/head-rush/HeadRushGame";

export const metadata = {
  title: "Head Rush",
  description: "Phone on your forehead, team shouting clues. Guess as many words as you can before the clock runs out.",
};

export default function HeadRushPage() {
  return <HeadRushGame />;
}
