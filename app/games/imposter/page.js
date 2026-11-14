import { ImposterGame } from "@/features/imposter/ImposterGame";

export const metadata = {
  title: "Imposter",
  description: "Everyone knows the secret word except the imposter. Give one-word clues, then vote out the faker.",
};

export default function ImposterPage() {
  return <ImposterGame />;
}
