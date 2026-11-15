import { MAX_MISSES } from "@/lib/games/hangman/engine";

/** Map the engine's latest event to a toast message. */
export function feedbackFromEvent(state, event) {
  if (!event) return null;
  const L = event.letter?.toUpperCase();
  const left = (e) => {
    const n = MAX_MISSES - e.misses;
    return n === 1 ? "Last miss left!" : `${n} misses left`;
  };

  switch (event.type) {
    case "letter-hit":
      return { id: event.seq, tone: "hit", title: `${L} ×${event.count}  +${event.points}`, detail: "Keep going" };
    case "letter-miss":
      return { id: event.seq, tone: "miss", title: `No ${L}`, detail: left(event) };
    case "word-miss":
      return { id: event.seq, tone: "miss", title: `“${event.guess}” isn’t it`, detail: left(event) };
    case "timeout":
      return { id: event.seq, tone: "miss", title: "Time’s up!", detail: left(event) };
    case "words-recycled":
      return { id: event.seq, tone: "info", title: "Every word played", detail: "Reshuffling the list" };
    default:
      return null;
  }
}
