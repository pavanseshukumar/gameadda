/** Map the engine's latest event to a toast message for the UI. */
export function feedbackFromEvent(state, event) {
  if (!event) return null;
  const L = event.letter?.toUpperCase();
  const livesLeft = (lives) => (lives === 0 ? "Last chance: name the song" : lives === 1 ? "Last life!" : `${lives} lives left`);

  switch (event.type) {
    case "letter-hit":
      return { id: event.seq, tone: "hit", title: `${L} ×${event.count}  +${event.points}`, detail: "Keep going" };
    case "letter-miss":
      return { id: event.seq, tone: "miss", title: `No ${L}`, detail: livesLeft(event.lives) };
    case "song-miss":
      return { id: event.seq, tone: "miss", title: `“${event.guess}” isn’t it`, detail: livesLeft(event.lives) };
    case "turn-timeout":
      return { id: event.seq, tone: "miss", title: "Time’s up!", detail: livesLeft(event.lives) };
    case "songs-recycled":
      return { id: event.seq, tone: "info", title: "All songs played", detail: "Reshuffling the playlist" };
    default:
      return null;
  }
}
