"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Hourglass, Map } from "lucide-react";
import { CATEGORY_IDS, STANDARD_CATEGORY_IDS } from "@/lib/games/pictionary/data/categories";
import { DEFAULT_TEAM_COLORS, DEFAULT_TEAM_NAMES, TEAM_COLOR_IDS } from "@/lib/games/pictionary/data/team-colors";
import { BOARD_LENGTHS } from "@/lib/games/pictionary/game-engine/board";
import { DEFAULT_SETTINGS, ROUND_LIMITS, TEAM_LIMITS, TIMER_OPTIONS } from "@/lib/games/pictionary/game-engine/engine";
import { loadSetup, saveSetup } from "@/lib/games/pictionary/storage";
import { gameActions, useGame } from "@/lib/games/pictionary/store/game-store";
import { usePrefs } from "@/lib/games/pictionary/store/prefs-store";
import { buildWordPool, countWords } from "@/lib/games/pictionary/word-bank";
import { cn, uid } from "@/lib/games/pictionary/utils";
import { Button } from "@/features/pictionary/shared/button";
import { ConfirmDialog } from "@/features/pictionary/shared/confirm-dialog";
import { Segmented, Stepper, Toggle } from "@/features/pictionary/shared/controls";
import { PageHeader, PageShell, SectionTitle } from "@/features/pictionary/shared/page-shell";
import { CategoryPicker } from "./category-picker";
import { CHALLENGE_IDS, CHALLENGE_MODES } from "@/lib/games/pictionary/data/challenges";
import { normalizeChallengeSettings } from "@/lib/games/pictionary/game-engine/challenges";
import { ChallengePicker } from "@/features/pictionary/challenges/challenge-visuals";
import { TeamEditor } from "./team-editor";

function defaultTeam(i) {
  return { key: uid("t"), name: DEFAULT_TEAM_NAMES[i], color: DEFAULT_TEAM_COLORS[i], players: [] };
}

function initialDraft() {
  const saved = loadSetup();
  if (saved) {
    return {
      settings: { ...DEFAULT_SETTINGS, ...saved.settings, ...normalizeChallengeSettings(saved.settings) },
      teams: saved.teams.slice(0, TEAM_LIMITS.max).map((t, i) => ({
        ...defaultTeam(i),
        name: typeof t.name === "string" ? t.name : DEFAULT_TEAM_NAMES[i],
        color: TEAM_COLOR_IDS.includes(t.color) ? t.color : DEFAULT_TEAM_COLORS[i],
        players: Array.isArray(t.players)
          ? t.players.filter((p) => typeof p?.name === "string").map((p) => ({ key: uid("p"), name: p.name }))
          : [],
      })),
    };
  }
  return { settings: DEFAULT_SETTINGS, teams: [defaultTeam(0), defaultTeam(1)] };
}

export function SetupScreen() {
  const { ready } = usePrefs();
  // Read saved setup only on the client, after hydration.
  return (
    <PageShell>
      <PageHeader eyebrow="New game" title="Set the table" />
      {ready ? <SetupForm /> : <div className="h-96 animate-pulse rounded-[1.75rem] bg-cream-deep" />}
    </PageShell>
  );
}

function SetupForm() {
  const router = useRouter();
  const { session } = useGame();
  const { customWords } = usePrefs();
  const [draft, setDraft] = useState(initialDraft);
  const [confirmReplace, setConfirmReplace] = useState(false);
  const { settings, teams } = draft;

  const setSetting = (key, value) => setDraft((d) => ({ ...d, settings: { ...d.settings, [key]: value } }));

  const setTeamCount = (count) =>
    setDraft((d) => {
      if (count <= d.teams.length) return { ...d, teams: d.teams.slice(0, count) };
      const next = [...d.teams];
      while (next.length < count) {
        const color = TEAM_COLOR_IDS.find((c) => !next.some((t) => t.color === c));
        const name = DEFAULT_TEAM_NAMES.find((n) => !next.some((t) => t.name === n)) ?? `Team ${next.length + 1}`;
        next.push({ ...defaultTeam(next.length), color, name });
      }
      return { ...d, teams: next };
    });

  const updateTeam = (key, patch) =>
    setDraft((d) => {
      let next = d.teams.map((t) => (t.key === key ? { ...t, ...patch } : t));
      // Picking a colour another team uses swaps the two teams' colours.
      if (patch.color) {
        const previous = d.teams.find((t) => t.key === key).color;
        next = next.map((t) => (t.key !== key && t.color === patch.color ? { ...t, color: previous } : t));
      }
      return { ...d, teams: next };
    });

  const pool = useMemo(
    () => buildWordPool(customWords, { includeCustom: settings.includeCustomWords }),
    [customWords, settings.includeCustomWords],
  );
  const wordCount = countWords(pool, settings);
  const hasCategory = settings.categories.length > 0;
  const onlyAllPlay = hasCategory && !settings.categories.some((c) => STANDARD_CATEGORY_IDS.includes(c));
  const canStart = hasCategory && !(settings.mode === "classic" && onlyAllPlay);
  const quickTurns = settings.rounds * teams.length;

  const start = () => {
    const config = {
      settings,
      teams: teams.map((t) => ({ name: t.name, color: t.color, players: t.players })),
    };
    saveSetup(config);
    gameActions.create(config, customWords);
    router.push("/games/pictionary/play");
  };

  const onStart = () => (session && session.phase !== "finished" ? setConfirmReplace(true) : start());

  return (
    <div className="flex flex-col gap-10 pb-28">
      {/* 1 · Mode */}
      <section className="animate-rise">
        <SectionTitle step="1">Pick a mode</SectionTitle>
        <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Game mode">
          <ModeCard
            selected={settings.mode === "classic"}
            onSelect={() => setSetting("mode", "classic")}
            icon={Map}
            title="Classic Board"
            body="Guess right, roll the die, race your token along the winding board. First to the finish wins."
          />
          <ModeCard
            selected={settings.mode === "quick"}
            onSelect={() => setSetting("mode", "quick")}
            icon={Hourglass}
            title="Quick Play"
            body="No board, no dice. Teams alternate for a set number of rounds — most points wins."
          />
        </div>
      </section>

      {/* 2 · Teams */}
      <section>
        <SectionTitle step="2">Teams & players</SectionTitle>
        <Segmented
          label="Number of teams"
          value={teams.length}
          onChange={setTeamCount}
          options={Array.from({ length: TEAM_LIMITS.max - TEAM_LIMITS.min + 1 }, (_, i) => ({
            value: TEAM_LIMITS.min + i,
            label: `${TEAM_LIMITS.min + i} teams`,
          }))}
        />
        <div className="mt-4 grid gap-4">
          {teams.map((team, i) => (
            <TeamEditor key={team.key} index={i} team={team} onChange={(patch) => updateTeam(team.key, patch)} />
          ))}
        </div>
        <p className="mt-3 text-sm text-ink-muted">
          Players are optional — add names and the app will rotate who draws each turn.
        </p>
      </section>

      {/* 3 · Rules */}
      <section>
        <SectionTitle step="3">House rules</SectionTitle>
        <div className="card-ink flex flex-col gap-7 p-5 sm:p-6">
          <Field label="Drawing time">
            <Segmented
              label="Drawing time"
              value={settings.timerSeconds}
              onChange={(v) => setSetting("timerSeconds", v)}
              options={TIMER_OPTIONS.map((s) => ({ value: s, label: `${s}s` }))}
            />
          </Field>

          {settings.mode === "quick" ? (
            <Field label="Rounds" hint={`Every team draws once per round · ${quickTurns} turns total`}>
              <Stepper
                label="Rounds"
                unit="rounds"
                value={settings.rounds}
                min={ROUND_LIMITS.min}
                max={ROUND_LIMITS.max}
                onChange={(v) => setSetting("rounds", v)}
              />
            </Field>
          ) : (
            <Field label="Board length">
              <Segmented
                label="Board length"
                value={settings.boardLength}
                onChange={(v) => setSetting("boardLength", v)}
                options={BOARD_LENGTHS.map((b) => ({ value: b.value, label: b.label, hint: `${b.value} spaces` }))}
              />
            </Field>
          )}

          <Field label="Difficulty">
            <Segmented
              label="Difficulty"
              value={settings.difficulty}
              onChange={(v) => setSetting("difficulty", v)}
              options={[
                { value: "easy", label: "Easy" },
                { value: "medium", label: "Medium" },
                { value: "hard", label: "Hard" },
                { value: "mixed", label: "Mixed" },
              ]}
            />
          </Field>

          <Field
            label="Categories"
            hint={
              settings.mode === "classic"
                ? "The board is built from these. All Play adds everyone-guesses spaces."
                : "Each turn draws from one of these. All Play turns pop up now and then."
            }
          >
            <CategoryPicker
              value={settings.categories}
              onChange={(v) => setSetting("categories", v)}
              all={CATEGORY_IDS}
            />
            {!hasCategory && <p className="mt-2 text-sm font-semibold text-coral-deep">Pick at least one category.</p>}
            {settings.mode === "classic" && onlyAllPlay && (
              <p className="mt-2 text-sm font-semibold text-coral-deep">
                Classic needs at least one category besides All Play.
              </p>
            )}
          </Field>

          <Field
            label="Drawing style"
            hint={
              settings.challengeMode === "random"
                ? "Each turn the drawer gets a surprise challenge from these, never the same one twice in a row."
                : settings.challengeMode === "host"
                  ? "Before every turn, the host chooses how the drawer must draw."
                  : "Everyone draws normally. Turn on challenges for extra chaos."
            }
          >
            <Segmented
              label="Drawing style"
              value={settings.challengeMode}
              onChange={(v) => setSetting("challengeMode", v)}
              options={CHALLENGE_MODES}
            />
            {settings.challengeMode === "random" && (
              <div className="mt-3 animate-rise">
                <ChallengePicker
                  label="Challenges in the random draw"
                  ids={CHALLENGE_IDS}
                  value={settings.challengePool}
                  onChange={(v) => setSetting("challengePool", v)}
                />
              </div>
            )}
          </Field>

          <Field label="Extras">
            <div className="divide-y-2 divide-dashed divide-line">
              {settings.mode === "classic" && (
                <Toggle
                  label="Keep the turn on a correct guess"
                  description="Traditional rule: a team keeps drawing while it keeps guessing right."
                  checked={settings.keepTurnOnSuccess}
                  onChange={(v) => setSetting("keepTurnOnSuccess", v)}
                />
              )}
              <Toggle
                label="Difficulty bonus"
                description="Medium words earn +1 point, hard words +2."
                checked={settings.difficultyBonus}
                onChange={(v) => setSetting("difficultyBonus", v)}
              />
              <Toggle
                label="Include my custom words"
                description={
                  customWords.length
                    ? `${customWords.length} custom word${customWords.length === 1 ? "" : "s"} in your word bank.`
                    : "Add your own words in Settings."
                }
                checked={settings.includeCustomWords}
                onChange={(v) => setSetting("includeCustomWords", v)}
              />
              <div className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                <span>
                  <span className="block font-semibold">Word skips per turn</span>
                  <span className="block text-sm text-ink-muted">The clock keeps its time when a word is skipped.</span>
                </span>
                <Segmented
                  label="Word skips per turn"
                  className="shrink-0 sm:w-48"
                  value={settings.maxSkipsPerTurn}
                  onChange={(v) => setSetting("maxSkipsPerTurn", v)}
                  options={[0, 1, 2, 3].map((n) => ({ value: n, label: String(n) }))}
                />
              </div>
            </div>
          </Field>
        </div>
      </section>

      {/* Sticky start bar */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t-2 border-ink bg-paper/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center gap-4">
          <p className="min-w-0 flex-1 text-sm leading-tight text-ink-soft">
            <span className="block font-display text-base font-bold text-ink">
              {settings.mode === "classic" ? "Classic Board" : `Quick Play · ${settings.rounds} rounds`}
            </span>
            {wordCount} words ready
            {settings.mode === "quick" && wordCount < quickTurns && " · some may repeat"}
          </p>
          <Button size="lg" variant="sun" disabled={!canStart} onClick={onStart}>
            Start game
            <ArrowRight className="size-5" strokeWidth={3} />
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmReplace}
        title="Replace your saved game?"
        body="You have a game in progress. Starting this one will erase it."
        confirmLabel="Replace it"
        onCancel={() => setConfirmReplace(false)}
        onConfirm={() => {
          setConfirmReplace(false);
          start();
        }}
      />
    </div>
  );
}

function ModeCard({ selected, onSelect, icon: Icon, title, body }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        "group relative flex flex-col items-start gap-3 rounded-[1.75rem] border-2 p-5 text-left transition active:scale-[0.98]",
        selected
          ? "border-ink bg-ink text-cream shadow-[0_5px_0_0_var(--color-coral)]"
          : "border-ink bg-paper shadow-[0_5px_0_0_var(--color-ink)] hover:-translate-y-0.5",
      )}
    >
      <span
        className={cn(
          "inline-flex size-12 items-center justify-center rounded-2xl",
          selected ? "bg-sun text-ink" : "bg-cream-deep text-ink",
        )}
      >
        <Icon className="size-6" strokeWidth={2.5} />
      </span>
      <span className="font-display text-2xl font-extrabold tracking-tight">{title}</span>
      <span className={cn("text-sm", selected ? "text-cream/80" : "text-ink-soft")}>{body}</span>
      <span
        aria-hidden
        className={cn(
          "absolute top-5 right-5 size-6 rounded-full border-2",
          selected ? "border-sun bg-sun ring-4 ring-ink ring-inset" : "border-line",
        )}
      />
    </button>
  );
}

function Field({ label, hint, children }) {
  return (
    <div>
      <p className="mb-2 font-display text-lg font-bold">{label}</p>
      {children}
      {hint && <p className="mt-2 text-sm text-ink-muted">{hint}</p>}
    </div>
  );
}
