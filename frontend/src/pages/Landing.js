import { Link } from "react-router-dom";

export default function Landing() {
  const year = new Date().getFullYear();

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 text-slate-50">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-6 md:px-6 md:py-10">
        <header className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 via-sky-400 to-indigo-500 text-xs font-bold uppercase text-slate-950 shadow-lg shadow-emerald-500/40">
              nq
            </div>
            <span className="text-sm font-semibold tracking-tight text-slate-100">
              anotequest
            </span>
          </Link>

          <nav className="flex items-center gap-3 text-xs md:text-sm">
            <Link
              to="/onboard"
              className="hidden text-slate-300 transition-colors hover:text-white sm:inline-flex"
            >
              Log in
            </Link>
            <Link
              to="/onboard"
              className="rounded-full border border-slate-700/70 px-3 py-1.5 text-slate-50 shadow-sm hover:bg-slate-900/60"
            >
              Sign up for free
            </Link>
            <a
              href="#plans"
              className="rounded-full bg-indigo-500 px-3.5 py-1.5 text-xs font-medium text-white shadow-md shadow-indigo-500/50 transition hover:bg-indigo-400 md:px-4 md:text-sm"
            >
              Try for free
            </a>
          </nav>
        </header>

        <section className="mt-10 grid flex-1 items-center gap-10 md:mt-14 md:grid-cols-2">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-emerald-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.95)]" />
              Capture ideas. Find them instantly.
            </div>

            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-50 md:text-4xl lg:text-5xl">
              A local-first note app that
              <span className="bg-gradient-to-r from-emerald-300 via-sky-300 to-indigo-400 bg-clip-text text-transparent">
                {" "}
                remembers everything
              </span>{" "}
              you write.
            </h1>

            <p className="mt-3 max-w-xl text-sm text-slate-300 md:text-base">
              anotequest lets you capture, search, and organize your notes at high speed, with your
              data staying on your device unless you choose to sync.
            </p>

            <div className="mt-5 flex flex-wrap gap-2 text-[11px] text-slate-200 md:text-xs">
              <span className="rounded-full border border-slate-700/70 bg-slate-900/80 px-3 py-1">
                Start free with 100 notes
              </span>
              <span className="rounded-full border border-slate-700/70 bg-slate-900/80 px-3 py-1">
                One-time unlock for this device
              </span>
              <span className="rounded-full border border-slate-700/70 bg-slate-900/80 px-3 py-1">
                Or sync across 3 devices with a subscription
              </span>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <a
                href="#plans"
                className="inline-flex items-center justify-center rounded-full bg-indigo-500 px-4 py-2 text-sm font-medium text-white shadow-md shadow-indigo-500/40 transition hover:bg-indigo-400"
              >
                Try for free
              </a>
              <a
                href="#plans"
                className="inline-flex items-center justify-center rounded-full border border-slate-700/80 px-4 py-2 text-sm font-medium text-slate-50 hover:bg-slate-900/70"
              >
                See all plans
              </a>
            </div>

            <p className="mt-3 text-[11px] text-slate-400 md:text-xs">
              No credit card required for the free plan. Upgrade later in one click.
            </p>
          </div>

          <div className="relative">
            <div className="glass relative rounded-3xl border border-slate-800/80 bg-slate-900/80 p-4 shadow-2xl shadow-black/60">
              <div className="mb-3 flex items-center justify-between text-[11px] text-slate-300">
                <span className="font-medium text-slate-200">anotequest</span>
                <div className="flex gap-1.5">
                  <button className="rounded-full bg-slate-800 px-2.5 py-1 text-[11px] font-medium text-slate-100 shadow-sm">
                    Notes
                  </button>
                  <button className="rounded-full border border-slate-600/80 bg-slate-900/80 px-2.5 py-1 text-[11px] text-slate-300">
                    Search
                  </button>
                </div>
              </div>

              <div className="grid gap-3 text-[11px] text-slate-200 sm:grid-cols-[0.9fr_1.1fr]">
                <div className="space-y-2 rounded-2xl bg-slate-950/70 p-2.5">
                  <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-indigo-500/70 via-indigo-400/70 to-sky-400/70 px-2.5 py-2 text-[11px] text-slate-50 shadow-lg shadow-indigo-500/60">
                    <span className="truncate font-medium">Ideas for next product launch</span>
                    <span className="rounded-full border border-indigo-200/70 bg-indigo-500/30 px-2 py-0.5 text-[9px] uppercase tracking-[0.16em]">
                      searchable
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl px-2.5 py-2 text-slate-200 hover:bg-slate-900/80">
                    <span className="truncate">Meeting notes - team sync</span>
                    <span className="rounded-full border border-slate-600/70 px-2 py-0.5 text-[9px] text-slate-300">
                      tag: work
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl px-2.5 py-2 text-slate-200 hover:bg-slate-900/80">
                    <span className="truncate">Personal journal - May</span>
                    <span className="rounded-full border border-slate-600/70 px-2 py-0.5 text-[9px] text-slate-300">
                      local
                    </span>
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-950/70 p-3">
                  <div className="mb-1.5 text-[12px] font-medium text-slate-100">Today's notes</div>
                  <p className="text-[11px] text-slate-300">
                    - Jot ideas instantly, no loading screens.
                    <br />
                    - Notes are stored locally on this device by default.
                    <br />
                    - Upgrade to sync and keep all devices in step.
                  </p>
                </div>
              </div>

              <div className="pointer-events-none absolute -bottom-3 right-4 flex items-center gap-2 rounded-full border border-sky-400/80 bg-sky-500/15 px-3 py-1 text-[10px] text-sky-100 shadow-md shadow-sky-500/40">
                <span className="h-1.5 w-1.5 rounded-full bg-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.9)]" />
                Search anything you have written, in milliseconds.
              </div>
            </div>
          </div>
        </section>

        <section id="plans" className="mt-14 md:mt-16">
          <h2 className="text-xl font-semibold tracking-tight text-slate-50 md:text-2xl">
            Choose how you want to use anotequest
          </h2>
          <p className="mt-1 text-sm text-slate-300">
            Start free with 100 notes. Unlock unlimited notes on this device with a one-time purchase, or
            subscribe to sync across multiple devices.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 shadow-lg">
              <div className="text-sm font-semibold text-slate-50">Try for free</div>
              <div className="mt-1 text-xs text-slate-300">Get started in seconds</div>
              <div className="mt-3 text-2xl font-semibold text-slate-50">$0</div>
              <ul className="mt-3 space-y-1.5 text-xs text-slate-200">
                <li>- Up to 100 notes</li>
                <li>- All core note-taking and search features</li>
                <li>- No credit card required</li>
                <li>- Data stored locally on this device</li>
              </ul>
              <Link
                to="/onboard"
                className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-indigo-500 px-3 py-2 text-sm font-medium text-white shadow-md shadow-indigo-500/40 transition hover:bg-indigo-400"
              >
                Start free
              </Link>
            </div>

            <div className="relative rounded-2xl border border-indigo-500/80 bg-slate-950/80 p-4 shadow-xl shadow-indigo-500/40">
              <div className="absolute right-3 top-3 rounded-full border border-indigo-400/70 bg-indigo-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-indigo-200">
                Most popular
              </div>
              <div className="text-sm font-semibold text-slate-50">Unlimited on this device</div>
              <div className="mt-1 text-xs text-slate-300">One-time unlock - no account required</div>
              <div className="mt-3 text-2xl font-semibold text-slate-50">
                $X
                <span className="ml-1 align-middle text-xs font-normal text-slate-300">one-time</span>
              </div>
              <ul className="mt-3 space-y-1.5 text-xs text-slate-200">
                <li>- Unlimited notes on a single device</li>
                <li>- Works fully offline</li>
                <li>- Your notes stay stored locally</li>
                <li>- No recurring payments</li>
              </ul>
              <button
                type="button"
                className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-indigo-500 px-3 py-2 text-sm font-medium text-white shadow-md shadow-indigo-500/50 transition hover:bg-indigo-400"
              >
                Unlock on this device
              </button>
              <p className="mt-2 text-[10px] text-slate-400">
                This unlock is tied to this device. If you switch or reset devices, you will need to unlock again.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 shadow-lg">
              <div className="text-sm font-semibold text-slate-50">Sync across devices</div>
              <div className="mt-1 text-xs text-slate-300">Up to 3 devices with cloud backup</div>
              <div className="mt-3 text-2xl font-semibold text-slate-50">
                $Y
                <span className="ml-1 align-middle text-xs font-normal text-slate-300">/ month</span>
              </div>
              <ul className="mt-3 space-y-1.5 text-xs text-slate-200">
                <li>- Unlimited notes across up to 3 devices</li>
                <li>- Automatic sync between your devices</li>
                <li>- Secure cloud backup of your notes</li>
                <li>- Requires an anotequest account</li>
              </ul>
              <Link
                to="/onboard"
                className="mt-4 inline-flex w-full items-center justify-center rounded-full border border-slate-700/80 px-3 py-2 text-sm font-medium text-slate-50 hover:bg-slate-900/70"
              >
                Create account
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-12 grid gap-8 md:grid-cols-2">
          <div>
            <h3 className="text-lg font-semibold tracking-tight text-slate-50">
              Fast, focused note-taking
            </h3>
            <p className="mt-2 text-sm text-slate-300">
              anotequest is designed to get out of your way so you can just write, then find what you need in
              milliseconds.
            </p>
            <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 text-[11px] font-medium text-emerald-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Built to be local-first
            </div>
            <ul className="mt-4 space-y-2 text-sm text-slate-200">
              <li>
                <span className="font-medium">Blazing fast search.</span> Find any note by keyword or tag as you
                type.
              </li>
              <li>
                <span className="font-medium">Lightweight but powerful.</span> Keep everything from quick jots to
                long documents.
              </li>
              <li>
                <span className="font-medium">Offline by default.</span> Take notes anywhere - airplane, subway, or
                low-signal areas.
              </li>
              <li>
                <span className="font-medium">Simple organization.</span> Tags and filters keep notes where you
                expect them.
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold tracking-tight text-slate-50">
              Your notes, your choice of storage
            </h3>
            <p className="mt-2 text-sm text-slate-300">
              Start with everything on your device. Turn on sync only if and when you want to connect multiple
              devices.
            </p>

            <div className="mt-4 space-y-4 text-sm">
              <div>
                <div className="font-medium text-slate-100">Do I need an account to use anotequest?</div>
                <p className="mt-1 text-xs text-slate-300">
                  No. You can use the free plan or unlock unlimited notes on this device without creating an
                  account. An account is only required if you choose the sync subscription.
                </p>
              </div>
              <div>
                <div className="font-medium text-slate-100">What happens when I hit 100 notes on the free plan?</div>
                <p className="mt-1 text-xs text-slate-300">
                  You can still read and search your notes, but you will need to upgrade or delete older notes to
                  create new ones.
                </p>
              </div>
              <div>
                <div className="font-medium text-slate-100">Is the one-time unlock tied to my device?</div>
                <p className="mt-1 text-xs text-slate-300">
                  Yes. Your unlimited access is stored locally on this device. If you switch or reset devices, you
                  will need to unlock again or choose the sync subscription.
                </p>
              </div>
              <div>
                <div className="font-medium text-slate-100">
                  Can I move from one-time unlock to a subscription later?
                </div>
                <p className="mt-1 text-xs text-slate-300">
                  Yes. You can add a subscription at any time to sync your notes across multiple devices.
                </p>
              </div>
            </div>
          </div>
        </section>

        <footer className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-4 text-[11px] text-slate-500">
          <span>
             a9 {year} anotequest. All rights reserved.
          </span>
          <div className="flex gap-4">
            <button type="button" className="text-slate-400 hover:text-slate-200">
              Privacy
            </button>
            <button type="button" className="text-slate-400 hover:text-slate-200">
              Terms
            </button>
            <button type="button" className="text-slate-400 hover:text-slate-200">
              Contact
            </button>
          </div>
        </footer>
      </div>
    </main>
  );
}
