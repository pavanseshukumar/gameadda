import { PixelPosterGame } from "@/features/pixel-poster/PixelPosterGame";

export const metadata = {
  title: "Poster Puzzle",
  description: "Name the Telugu movie from a shuffled, blurred poster that clears up as the clock runs.",
};

export default function PixelPosterPage() {
  return <PixelPosterGame />;
}
