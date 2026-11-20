import { HiLoGame } from "@/features/hi-lo/HiLoGame";

export const metadata = {
  title: "Hi-Lo",
  description: "Higher or lower? Call the next playing card right and keep it. Most cards wins. Solo or pass the phone.",
};

export default function HiLoPage() {
  return <HiLoGame />;
}
