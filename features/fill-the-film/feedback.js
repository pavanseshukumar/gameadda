import { selectTeam } from "@/lib/games/fill-the-film/engine";

/** Map the engine's latest event to a toast message. Letters, clues and give-ups have their own dialog. */
export function feedbackFromEvent(state, event) {
  if (!event) return null;
  const solo = state.teams.length === 1;
  const next = !solo && event.nextTeamId ? `${selectTeam(state, event.nextTeamId)?.name ?? "Next team"}’s turn` : undefined;

  switch (event.type) {
    case "solved":
      return { id: event.seq, tone: "hit", title: `Got it! +${event.points}`, detail: "On to the next movie" };
    case "list-done":
      return { id: event.seq, tone: "hit", title: event.bonus ? `List cleared! +${event.bonus} bonus` : "List cleared!", detail: next };
    case "wrong":
      return { id: event.seq, tone: "miss", title: `“${event.guess}” isn’t it`, detail: next };
    case "timeout":
      return { id: event.seq, tone: "miss", title: "Time’s up!", detail: next };
    case "turn-passed":
      return next ? { id: event.seq, tone: "info", title: next } : null;
    default:
      return null;
  }
}
