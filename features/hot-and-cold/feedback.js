import { selectTeam } from "@/lib/games/hot-and-cold/engine";
import { bandFor } from "@/lib/games/hot-and-cold/temperature";

/** Map the engine's latest event to a toast message. */
export function feedbackFromEvent(state, event) {
  if (!event) return null;
  const team = (id) => selectTeam(state, id)?.name ?? "A team";

  switch (event.type) {
    case "guess": {
      const band = bandFor(event.score);
      return {
        id: event.seq,
        tone: event.score >= 45 ? "hit" : event.score < 10 ? "miss" : "info",
        title: `${event.title}: ${event.score}° ${band.label}`,
        detail: `${team(event.teamId)} guessed`,
      };
    }
    case "repeat":
      return { id: event.seq, tone: "info", title: `${event.title} is already on the board`, detail: "Pick another movie" };
    case "timeout":
      return { id: event.seq, tone: "miss", title: "Time’s up!", detail: `Over to ${team(event.nextTeamId)}` };
    case "movies-recycled":
      return { id: event.seq, tone: "info", title: "All movies played", detail: "Reshuffling the list" };
    default:
      return null;
  }
}
