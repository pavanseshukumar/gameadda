import { selectTeam } from "@/lib/games/jumble-rumble/engine";

/** Map the engine's latest event to a toast message. */
export function feedbackFromEvent(state, event) {
  if (!event) return null;
  const team = (id) => selectTeam(state, id)?.name ?? "Next team";

  switch (event.type) {
    case "wrong":
      return { id: event.seq, tone: "miss", title: `${event.guess} isn’t it`, detail: event.steal ? `${team(event.nextTeamId)} can steal` : "Round over" };
    case "timeout":
      return { id: event.seq, tone: "miss", title: "Time’s up!", detail: event.steal ? `${team(event.nextTeamId)} can steal` : "Round over" };
    case "movies-recycled":
      return { id: event.seq, tone: "info", title: "All movies played", detail: "Reshuffling the list" };
    default:
      return null;
  }
}
