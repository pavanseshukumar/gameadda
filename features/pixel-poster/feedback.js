import { selectTeam } from "@/lib/games/pixel-poster/engine";

/** Map the engine's latest event to a toast message. */
export function feedbackFromEvent(state, event) {
  if (!event) return null;
  const team = (id) => selectTeam(state, id)?.name ?? "Next team";

  switch (event.type) {
    case "wrong":
      return { id: event.seq, tone: "miss", title: `Not “${event.guess}”`, detail: "Keep guessing!" };
    case "timeout":
      return event.steal
        ? { id: event.seq, tone: "miss", title: "Time’s up!", detail: `${team(event.nextTeamId)} can steal` }
        : null;
    case "skipped":
      return { id: event.seq, tone: "info", title: "New poster", detail: "Same team, fresh movie" };
    case "movies-recycled":
      return { id: event.seq, tone: "info", title: "All movies played", detail: "Reshuffling the list" };
    default:
      return null;
  }
}
