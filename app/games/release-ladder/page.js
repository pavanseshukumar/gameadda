import { ReleaseLadderGame } from "@/features/release-ladder/ReleaseLadderGame";

export const metadata = {
  title: "Release Ladder",
  description: "Which came first? Drag Telugu movies into the order they hit theatres.",
};

export default function ReleaseLadderPage() {
  return <ReleaseLadderGame />;
}
