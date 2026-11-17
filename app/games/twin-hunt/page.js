import { TwinHuntGame } from "@/features/twin-hunt/TwinHuntGame";

export const metadata = {
  title: "Twin Hunt",
  description: "Flip two cards and find the twins: same picture, same colour. Remember where everything was.",
};

export default function TwinHuntPage() {
  return <TwinHuntGame />;
}
