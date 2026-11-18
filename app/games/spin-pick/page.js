import { SpinPickGame } from "@/features/spin-pick/SpinPickGame";

export const metadata = {
  title: "Spin Pick",
  description: "Call a colour, flick the fidget spinner, and see where it stops. Solo or with friends.",
};

export default function SpinPickPage() {
  return <SpinPickGame />;
}
