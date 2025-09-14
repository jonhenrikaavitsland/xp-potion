import React, { useEffect, useMemo, useState } from "react";

// MysteryBoostGuess — interactive flavor guessing widget
// Tailwind v4-ready. Drop into an Astro page as a React island.
// Usage in .astro:
// ---
// import MysteryBoostGuess from "../components/MysteryBoostGuess";
// ---
// <MysteryBoostGuess client:load />

export type GuessPayload = {
  flavor: string;
  nickname?: string;
  email: string;
  consent: boolean;
};

export type MysteryBoostGuessProps = {
  onSubmit?: (payload: GuessPayload) => Promise<void> | void; // hook into your backend if needed
  cooldownSeconds?: number; // default 30s between guesses
  title?: string;
  subtitle?: string;
};

const DEFAULT_FEEDBACK: string[] = [
  "You're getting warmer 🔥",
  "Not even close… but nice try 😏",
  "The flavor is fruity, but not what you think 🍓❌",
  "You might be onto something 👀",
  "Keep hunting, adventurer. The mystery remains unsolved 🗝️",
  "Hints unlock with community votes — check back soon 🧩",
  "A little exotic. A little familiar. Very sneaky 🐉✨",
  "Think hybrid. Two fruits enter, one mystery leaves ⚔️🍇🍍",
];

const emailRe = /^(?:[a-zA-Z0-9_'^&+%`{}~!-]+(?:\.[a-zA-Z0-9_'^&+%`{}~!-]+)*|".+")@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;

function classNames(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

export default function MysteryBoostGuess({
  onSubmit,
  cooldownSeconds = 30,
  title = "Submit Your Flavor Guess",
  subtitle = "Take your shot at unmasking Mystery Boost. Every guess gets you one step closer to exclusive rewards.",
}: MysteryBoostGuessProps) {
  const [flavor, setFlavor] = useState("");
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Cooldown state
  const [cooldownEnd, setCooldownEnd] = useState<number | null>(null);
  const [now, setNow] = useState<number>(Date.now());

  // Persist cooldown to localStorage so users can't spam refresh
  useEffect(() => {
    const key = "mystery-boost-cooldown";
    const stored = typeof window !== "undefined" ? window.localStorage.getItem(key) : null;
    if (stored) {
      const t = parseInt(stored, 10);
      if (!Number.isNaN(t)) setCooldownEnd(t);
    }
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, []);

  const secondsLeft = useMemo(() => {
    if (cooldownEnd == null) return 0;
    const diff = Math.ceil((cooldownEnd - now) / 1000);
    return diff > 0 ? diff : 0;
  }, [cooldownEnd, now]);

  const disabled = busy || secondsLeft > 0;

  function pickFeedback(seed: string) {
    // Semi-stable random: derive index from input string hash
    const str = (seed || "mystery") + Date.now().toString().slice(0, -3); // changes roughly per second
    let h = 0;
    for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
    const idx = Math.abs(h) % DEFAULT_FEEDBACK.length;
    return DEFAULT_FEEDBACK[idx];
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFeedback(null);

    // Basic validation
    if (!flavor.trim()) return setError("Please enter your flavor guess.");
    if (!email.trim() || !emailRe.test(email.trim())) return setError("Please enter a valid email address.");
    if (!consent) return setError("Please accept the consent to receive updates and hints.");

    try {
      setBusy(true);
      const payload: GuessPayload = { flavor: flavor.trim(), nickname: nickname.trim() || undefined, email: email.trim(), consent };

      // External hook
      await onSubmit?.(payload);

      // Local UX feedback
      const line = pickFeedback(flavor);
      setFeedback(line);

      // Start cooldown
      const end = Date.now() + cooldownSeconds * 1000;
      setCooldownEnd(end);
      try { window.localStorage.setItem("mystery-boost-cooldown", String(end)); } catch {}

      // Optionally clear fields except email (so repeat guesses are faster)
      setFlavor("");
      setNickname("");
    } catch (err: any) {
      setError(err?.message || "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="flex flex-col gap-4 mx-auto w-full max-w-xl rounded-2xl bg-neutral-800 p-5 backdrop-blur-md shadow">
      <header className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold font-serif">{title}</h2>
        <p className="text-neutral-300">{subtitle}</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="flavor" className="block text-sm font-medium">Flavor Guess</label>
          <input
            id="flavor"
            type="text"
            placeholder="Type your guess… (e.g. Dragonfruit Kiwi)"
            value={flavor}
            onChange={(e) => setFlavor(e.target.value)}
            className="mt-1 w-full rounded-xl bg-neutral-700 px-3 py-2 outline-none focus:ring-2 focus:ring-accent-neon-pink"
          />
        </div>

        <div>
          <label htmlFor="nick" className="block text-sm font-medium">Nickname / Gamer Tag (optional)</label>
          <input
            id="nick"
            type="text"
            placeholder="Enter your gamer tag"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className="mt-1 w-full rounded-xl bg-neutral-700 px-3 py-2 outline-none focus:ring-2 focus:ring-accent-neon-pink"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium">Email</label>
          <input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-xl bg-neutral-700 px-3 py-2 outline-none focus:ring-2 focus:ring-accent-neon-pink"
            required
          />
        </div>

        {/* <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-1 size-4 rounded appearance-none checked:border bg-neutral-700 checked:border-accent-neon-pink"
          />
          <span>I agree to receive updates, hints, and promotions from XP Potion.</span>
        </label> */}

        <label className="flex items-start gap-3 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="peer mt-1 size-4 rounded appearance-none border border-neutral-600 bg-neutral-700 checked:bg-accent-neon-pink checked:border-accent-neon-pink flex items-center justify-center"
          />
          {/* Custom checkmark */}
          <svg
            className="pointer-events-none absolute hidden size-4 text-white peer-checked:block mt-1"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            viewBox="0 0 24 24"
          >
            <path d="M5 13l4 4L19 7" />
          </svg>
          <span>I agree to receive updates, hints, and promotions from XP Potion.</span>
        </label>

        {error && (
          <p role="alert" className="rounded-lg border border-red-500 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>
        )}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={disabled}
            className={classNames(
              "rounded-xl px-5 py-2 font-semibold text-white shadow",
              disabled ? "bg-neutral-600 cursor-not-allowed" : "bg-accent-magenta-purple hover:bg-accent-neon-pink transition-colors"
            )}
            aria-disabled={disabled}
          >
            {secondsLeft > 0 ? `Try again in ${secondsLeft}s` : busy ? "Submitting…" : "Submit your guess"}
          </button>
          <div className="text-xs text-neutral-400">
            By submitting, you join the Mystery Boost quest. Sip · Guess · Win.
          </div>
        </div>
      </form>

      {feedback && (
        <div className="mt-4 rounded-xl bg-neutral-700 p-4">
          <p className="text-sm">
            <span className="mr-2 inline-block rounded-lg bg-neutral-900 px-4 py-2 text-xs">Clue</span>
            {feedback}
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            <a href="#" className="rounded-lg bg-neutral-900 px-4 py-2 hover:text-accent-neon-pink">Join the hunt</a>
            <a href="#" className="rounded-lg bg-neutral-900 px-4 py-2 hover:text-accent-neon-pink">Submit another guess</a>
            <a href="#" className="rounded-lg bg-neutral-900 px-4 py-2 hover:text-accent-neon-pink">#GuessTheBoost</a>
          </div>
        </div>
      )}
    </section>
  );
}
