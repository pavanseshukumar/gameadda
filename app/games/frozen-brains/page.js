import { FrozenBrainsGame } from "@/features/frozen-brains/FrozenBrainsGame";

export const metadata = {
  title: "Frozen Brains",
  description: "Say the nonsense out loud, fast, until the real words pop out. FRY DRY ICE? Fried rice!",
};

export default function FrozenBrainsPage() {
  return <FrozenBrainsGame />;
}
