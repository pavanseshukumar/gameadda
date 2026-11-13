import { PixelPosterGame } from "@/features/pixel-poster/PixelPosterGame";

export const metadata = {
  title: "Pixel Poster",
  description: "Name the Telugu movie from a pixelated poster that sharpens as the clock runs.",
};

export default function PixelPosterPage() {
  return <PixelPosterGame />;
}
