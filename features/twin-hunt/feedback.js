import { selectTeam } from "@/lib/games/twin-hunt/engine";

/** Map the engine's latest event to a toast message. */
export function feedbackFromEvent(state, event) {
  if (!event) return null;
  const solo = state.teams.length === 1;
  const team = (id) => selectTeam(state, id)?.name ?? "Next team";

  switch (event.type) {
    case "match":
      return {
        id: event.seq,
        tone: "hit",
        title: event.streak > 1 ? `${event.streak} in a row! +${event.points}` : `Twins! +${event.points}`,
        detail: solo ? `Two ${event.name}s` : `${team(event.teamId)} goes again`,
      };
    case "turn":
      return { id: event.seq, tone: "info", title: `${team(event.teamId)}’s turn` };
    default:
      return null;
  }
}
