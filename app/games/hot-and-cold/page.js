import { HotAndColdGame } from "@/features/hot-and-cold/HotAndColdGame";

export const metadata = {
  title: "Hot & Cold",
  description: "Find the secret Telugu movie: every guess gets a temperature.",
};

export default function HotAndColdPage() {
  return <HotAndColdGame />;
}
