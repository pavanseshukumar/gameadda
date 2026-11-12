import { selectTeam } from "@/lib/games/guess-the-song/engine";

/** Map the engine's latest event to a toast message for the UI. */
export function feedbackFromEvent(state, event) {
  if (!event) return null;
  const team = (id) => selectTeam(state, id)?.name ?? "Next team";
  const L = event.letter?.toUpperCase();

  switch (event.type) {
    case "letter-hit":
      return {
        id: event.seq,
        tone: "hit",
        title: `${L} ×${event.count}  +${event.points}`,
        detail: `${team(event.teamId)} goes again`,
      };
    case "letter-miss":
      return { id: event.seq, tone: "miss", title: `No ${L}`, detail: `Over to ${team(event.nextTeamId)}` };
    case "song-miss":
      return {
        id: event.seq,
        tone: "miss",
        title: `“${event.guess}” isn’t it`,
        detail: `Over to ${team(event.nextTeamId)}`,
      };
    case "songs-recycled":
      return { id: event.seq, tone: "info", title: "All songs played", detail: "Reshuffling the playlist" };
    default:
      return null;
  }
}
