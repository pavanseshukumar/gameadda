import { getCategory } from "@/lib/games/pictionary/data/categories";
import { CategoryIcon } from "@/features/pictionary/shared/category-badge";
import { Die } from "@/features/pictionary/board/die";

const CARDS = [
  { category: "animal", word: "Peacock", r: "-8deg", pos: "left-[4%] top-[14%]", delay: "0s" },
  { category: "movies", word: "Sholay", r: "6deg", pos: "right-[4%] top-[4%]", delay: "-1.2s" },
  { category: "food", word: "Pani Puri", r: "-3deg", pos: "left-[22%] bottom-[6%]", delay: "-2.1s" },
  { category: "action", word: "Moonwalking", r: "9deg", pos: "right-[2%] bottom-[22%]", delay: "-0.6s" },
];

/** Decorative cluster of tilted word cards and a die. Purely visual. */
export function HeroDoodles() {
  return (
    <div aria-hidden className="relative mx-auto aspect-[5/4] w-full max-w-lg select-none animate-pop-in">
      <div className="absolute inset-[12%] rounded-[3rem] bg-sun/25" />
      <svg viewBox="0 0 400 320" className="absolute inset-0 size-full text-ink/25">
        <path
          d="M40 250 C 90 170, 150 300, 210 200 S 330 120, 360 60"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeDasharray="2 10"
          strokeLinecap="round"
        />
      </svg>
      {CARDS.map((c) => {
        const cat = getCategory(c.category);
        return (
          <div
            key={c.word}
            className={`absolute ${c.pos} w-[46%] max-w-56 animate-float`}
            style={{ "--r": c.r, animationDelay: c.delay }}
          >
            <div className="card-ink overflow-hidden">
              <div
                className="flex items-center gap-2 px-4 py-2 font-display text-sm font-bold"
                style={{ background: cat.color, color: cat.ink }}
              >
                <CategoryIcon category={c.category} className="size-4" strokeWidth={2.5} />
                {cat.label}
              </div>
              <p className="px-4 py-4 font-display text-xl font-extrabold tracking-tight sm:text-2xl">{c.word}</p>
            </div>
          </div>
        );
      })}
      <div className="absolute top-[42%] left-[44%] animate-float" style={{ "--r": "14deg", animationDelay: "-1.7s" }}>
        <Die value={5} size={76} />
      </div>
    </div>
  );
}
