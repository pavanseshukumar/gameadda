import { TuneInGame } from "@/features/tune-in/TuneInGame";

export const metadata = {
  title: "Tune In",
  description: "Hear a clip of a Telugu film song and name the movie. The less you need to hear, the more you score.",
};

export default function TuneInPage() {
  return <TuneInGame />;
}
