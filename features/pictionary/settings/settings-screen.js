"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { CATEGORY_IDS, getCategory } from "@/lib/games/pictionary/data/categories";
import { gameActions, useGame } from "@/lib/games/pictionary/store/game-store";
import { prefsActions, usePrefs } from "@/lib/games/pictionary/store/prefs-store";
import { sfx } from "@/lib/games/pictionary/utils/feedback";
import { Button } from "@/features/pictionary/shared/button";
import { CategoryBadge } from "@/features/pictionary/shared/category-badge";
import { ConfirmDialog } from "@/features/pictionary/shared/confirm-dialog";
import { Segmented, Toggle } from "@/features/pictionary/shared/controls";
import { PageHeader, PageShell, SectionTitle } from "@/features/pictionary/shared/page-shell";

export function SettingsScreen() {
  const { ready, prefs, customWords } = usePrefs();
  const { session } = useGame();
  const [confirm, setConfirm] = useState(null);

  return (
    <PageShell>
      <PageHeader eyebrow="Preferences" title="Settings" />

      <div className="flex flex-col gap-10 pb-6">
        <section>
          <SectionTitle>Sound & feel</SectionTitle>
          <div className="card-ink divide-y-2 divide-dashed divide-line px-5 py-2">
            <Toggle
              label="Sound effects"
              description="Timer ticks, buzzer, dice rattle and fanfare."
              checked={prefs.sound}
              onChange={(v) => {
                prefsActions.setPref("sound", v);
                if (v) sfx.tap();
              }}
            />
            <Toggle
              label="Vibration"
              description="Buzz when time runs out (on supported phones)."
              checked={prefs.vibration}
              onChange={(v) => prefsActions.setPref("vibration", v)}
            />
          </div>
        </section>

        <section>
          <SectionTitle
            aside={
              customWords.length > 0 && (
                <button
                  type="button"
                  onClick={() => setConfirm("words")}
                  className="text-sm font-semibold text-coral-deep hover:underline"
                >
                  Clear all
                </button>
              )
            }
          >
            Your words
          </SectionTitle>
          <p className="-mt-2 mb-4 text-ink-soft">
            Add inside jokes, local spots and family legends. They’re mixed into new games when “Include my custom
            words” is on.
          </p>
          <AddWordForm />
          {ready && customWords.length > 0 ? (
            <ul className="mt-4 flex flex-col gap-2">
              {customWords.map((w) => (
                <li key={w.id} className="flex items-center gap-3 rounded-2xl border-2 border-line bg-paper py-2 pr-2 pl-4 animate-pop-in">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-display text-lg font-bold">{w.text}</span>
                    <span className="text-xs font-semibold text-ink-muted capitalize">{w.difficulty}</span>
                  </span>
                  <CategoryBadge category={w.category} size="sm" />
                  <button
                    type="button"
                    aria-label={`Remove ${w.text}`}
                    onClick={() => prefsActions.removeCustomWord(w.id)}
                    className="inline-flex size-10 items-center justify-center rounded-full text-ink-muted hover:bg-cream-deep hover:text-coral-deep"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 rounded-2xl border-2 border-dashed border-line p-4 text-center text-sm text-ink-muted">
              No custom words yet.
            </p>
          )}
        </section>

        <section>
          <SectionTitle>Saved game</SectionTitle>
          <div className="card-ink flex items-center justify-between gap-4 p-5">
            <p className="text-ink-soft">
              {session
                ? "A game is saved on this device. Everything stays local — nothing leaves your phone."
                : "No saved game. Games are stored only on this device."}
            </p>
            <Button variant="danger" size="sm" disabled={!session} onClick={() => setConfirm("game")}>
              Delete
            </Button>
          </div>
        </section>
      </div>

      <ConfirmDialog
        open={confirm === "game"}
        title="Delete the saved game?"
        body="Scores, positions and progress for the current game will be lost."
        confirmLabel="Delete game"
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          gameActions.clear();
          setConfirm(null);
        }}
      />
      <ConfirmDialog
        open={confirm === "words"}
        title="Clear all custom words?"
        body={`This removes ${customWords.length} word${customWords.length === 1 ? "" : "s"} from your word bank.`}
        confirmLabel="Clear words"
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          prefsActions.clearCustomWords();
          setConfirm(null);
        }}
      />
    </PageShell>
  );
}

function AddWordForm() {
  const [text, setText] = useState("");
  const [category, setCategory] = useState("object");
  const [difficulty, setDifficulty] = useState("medium");
  const [error, setError] = useState(null);

  const submit = (e) => {
    e.preventDefault();
    const problem = prefsActions.addCustomWord({ text, category, difficulty });
    setError(problem);
    if (!problem) setText("");
  };

  return (
    <form onSubmit={submit} className="card-ink flex flex-col gap-4 p-5">
      <div className="flex gap-2">
        <label htmlFor="custom-word" className="sr-only">
          New word
        </label>
        <input
          id="custom-word"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setError(null);
          }}
          maxLength={40}
          placeholder="e.g. Uncle Ravi’s scooter"
          autoComplete="off"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "custom-word-error" : undefined}
          className="min-h-12 min-w-0 flex-1 rounded-2xl border-2 border-line bg-cream px-4 font-medium focus:border-ink focus:outline-none"
        />
        <Button type="submit" variant="ink" disabled={!text.trim()} aria-label="Add word">
          <Plus className="size-5" strokeWidth={3} />
          <span className="hidden sm:inline">Add</span>
        </Button>
      </div>
      {error && (
        <p id="custom-word-error" className="-mt-2 text-sm font-semibold text-coral-deep">
          {error}
        </p>
      )}
      <div>
        <label htmlFor="custom-category" className="mb-1.5 block text-sm font-bold">
          Category
        </label>
        <select
          id="custom-category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="min-h-12 w-full rounded-2xl border-2 border-line bg-cream px-4 font-semibold focus:border-ink focus:outline-none"
        >
          {CATEGORY_IDS.map((id) => (
            <option key={id} value={id}>
              {getCategory(id).label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <p className="mb-1.5 text-sm font-bold">Difficulty</p>
        <Segmented
          label="Difficulty"
          value={difficulty}
          onChange={setDifficulty}
          options={[
            { value: "easy", label: "Easy" },
            { value: "medium", label: "Medium" },
            { value: "hard", label: "Hard" },
          ]}
        />
      </div>
    </form>
  );
}
