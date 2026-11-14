import { Ban, Dices, Eye, Hourglass, Megaphone, Shuffle, Trophy, Users } from "lucide-react";
import { CATEGORY_IDS, getCategory } from "@/lib/games/pictionary/data/categories";
import { CHALLENGE_IDS, getChallenge } from "@/lib/games/pictionary/data/challenges";
import { ButtonLink } from "@/features/pictionary/shared/button";
import { CategoryIcon } from "@/features/pictionary/shared/category-badge";
import { PageHeader, PageShell } from "@/features/pictionary/shared/page-shell";

export const metadata = { title: "How to play" };

const STEPS = [
  {
    icon: Users,
    title: "Form teams",
    body: "Split into 2–4 teams of two or more. Each team gets paper and a pen. One person hosts and holds the phone between turns.",
  },
  {
    icon: Eye,
    title: "Get the secret word",
    body: "The app picks the drawer and a word from the turn’s category. Pass the phone to the drawer, who reveals the word privately, then hides it.",
  },
  {
    icon: Hourglass,
    title: "Draw against the clock",
    body: "Starting the timer hides the word. The drawer sketches on paper while their team shouts guesses. Pause if life happens; the timer stays accurate even if the screen locks.",
  },
  {
    icon: Megaphone,
    title: "Guess out loud",
    body: "Teammates can guess as often as they like. The exact word or phrase counts. Close enough is the host’s call, so be generous or be strict, just be consistent.",
  },
  {
    icon: Shuffle,
    title: "Stuck? Skip",
    body: "Depending on your house rules, the drawer may swap the word. The new word is revealed privately and the clock keeps the time already used.",
  },
];

export default function Page() {
  return (
    <PageShell>
      <PageHeader eyebrow="The rules" title="How to play" />

      <div className="flex flex-col gap-8 pb-6">
        <section className="flex items-start gap-4 rounded-[1.75rem] bg-ink p-5 text-cream">
          <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-2xl bg-coral">
            <Ban className="size-6" />
          </span>
          <div>
            <h2 className="font-display text-xl font-extrabold">The golden rule</h2>
            <p className="mt-1 text-cream/85">
              While drawing, the drawer <strong>can’t speak, write letters or numbers, or use gestures</strong> to
              hint at the word. Pictures and symbols only. Arrows and dashes for word count are fine if your table
              allows them.
            </p>
          </div>
        </section>

        <ol className="flex flex-col gap-3">
          {STEPS.map(({ icon: Icon, title, body }, i) => (
            <li key={title} className="card-ink flex gap-4 p-5">
              <span className="relative inline-flex size-12 shrink-0 items-center justify-center rounded-2xl bg-sun-soft">
                <Icon className="size-6" />
                <span className="absolute -top-2 -left-2 inline-flex size-6 items-center justify-center rounded-full bg-ink font-display text-xs font-bold text-sun">
                  {i + 1}
                </span>
              </span>
              <div>
                <h3 className="font-display text-xl font-extrabold">{title}</h3>
                <p className="mt-1 text-ink-soft">{body}</p>
              </div>
            </li>
          ))}
        </ol>

        <section>
          <h2 className="mb-3 font-display text-2xl font-extrabold tracking-tight">Two ways to play</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="card-ink p-5">
              <Dices className="size-7" />
              <h3 className="mt-3 font-display text-xl font-extrabold">Classic Board</h3>
              <ul className="mt-2 list-disc space-y-1.5 pl-5 text-ink-soft">
                <li>Your token’s space sets the category for your next turn.</li>
                <li>Guess correctly and you roll the die and move forward. Miss and you stay put.</li>
                <li>Optional rule: keep drawing while you keep guessing right.</li>
                <li>First team to reach the finish wins.</li>
              </ul>
            </div>
            <div className="card-ink p-5">
              <Hourglass className="size-7" />
              <h3 className="mt-3 font-display text-xl font-extrabold">Quick Play</h3>
              <ul className="mt-2 list-disc space-y-1.5 pl-5 text-ink-soft">
                <li>No board, no dice. Teams take turns for a set number of rounds.</li>
                <li>Every correct guess scores 1 point (more with the difficulty bonus).</li>
                <li>Missed turns score nothing.</li>
                <li>Most points after the last round wins. Ties share the crown.</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="card-ink p-5">
          <div className="flex items-center gap-3">
            <span className="inline-flex size-10 items-center justify-center rounded-xl bg-ink text-sun">
              <Users className="size-5" />
            </span>
            <h2 className="font-display text-xl font-extrabold">All Play</h2>
          </div>
          <p className="mt-2 text-ink-soft">
            On All Play, one team’s drawer draws but <strong>every team guesses at once</strong>. The host taps
            whichever team shouts the answer first. They score, and on the board they roll and move.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl font-extrabold tracking-tight">Drawing challenges</h2>
          <p className="mt-1 mb-3 text-ink-soft">
            Optional handicaps. Pick <strong>Random</strong> or <strong>Host picks</strong> in setup, and the drawer
            sees their challenge right before the word. Scoring doesn’t change.
          </p>
          <ul className="grid gap-2 sm:grid-cols-2">
            {CHALLENGE_IDS.map((id) => {
              const c = getChallenge(id);
              return (
                <li key={id} className="flex items-start gap-3 rounded-2xl border-2 border-ink p-3" style={{ background: c.color, color: c.ink }}>
                  <span className="text-3xl leading-none" aria-hidden>
                    {c.emoji}
                  </span>
                  <span>
                    <span className="block font-display font-extrabold">{c.name}</span>
                    <span className="block text-sm opacity-85">{c.short}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </section>

        <section>
          <h2 className="mb-3 font-display text-2xl font-extrabold tracking-tight">Categories</h2>
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {CATEGORY_IDS.map((id) => {
              const c = getCategory(id);
              return (
                <li key={id} className="rounded-2xl border-2 border-ink p-3" style={{ background: c.color, color: c.ink }}>
                  <CategoryIcon category={id} className="size-5" strokeWidth={2.5} />
                  <p className="mt-2 font-display font-extrabold">{c.label}</p>
                  <p className="text-xs opacity-85">{c.hint}</p>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="flex items-start gap-4 rounded-[1.75rem] border-2 border-dashed border-ink/30 p-5">
          <Trophy className="mt-0.5 size-6 shrink-0" />
          <p className="text-ink-soft">
            <strong className="text-ink">Winning:</strong> In Classic, the first token to the finish wins. In Quick Play,
            the highest score after the final round wins. The host can end any game early, and whoever is leading
            takes it.
          </p>
        </section>

        <ButtonLink href="/games/pictionary/setup" size="xl" variant="sun" block>
          Start a game
        </ButtonLink>
      </div>
    </PageShell>
  );
}
