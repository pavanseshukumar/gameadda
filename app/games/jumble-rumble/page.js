import { JumbleRumbleGame } from "@/features/jumble-rumble/JumbleRumbleGame";

export const metadata = {
  title: "Jumble Rumble",
  description: "Unscramble Telugu movie titles against the clock.",
};

export default function JumbleRumblePage() {
  return <JumbleRumbleGame />;
}
