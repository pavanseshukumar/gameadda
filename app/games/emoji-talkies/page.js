import { EmojiTalkiesGame } from "@/features/emoji-talkies/EmojiTalkiesGame";

export const metadata = {
  title: "Emoji Talkies",
  description: "Decode a Telugu movie title from a row of emojis before the clock (and your points) run down.",
};

export default function EmojiTalkiesPage() {
  return <EmojiTalkiesGame />;
}
