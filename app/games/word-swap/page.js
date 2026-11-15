import { WordSwapGame } from "@/features/word-swap/WordSwapGame";

export const metadata = {
  title: "Word Swap",
  description: "Teams set secret words for each other, then crack them in six tries. Every guess marks each letter.",
};

export default function WordSwapPage() {
  return <WordSwapGame />;
}
