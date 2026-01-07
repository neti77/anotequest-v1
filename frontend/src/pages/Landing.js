import { Link } from "react-router-dom";
import { useTheme } from "next-themes";

export default function Landing() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const year = new Date().getFullYear();

  return (
    <main
      className={
        "min-h-screen " +
        (isDark
          ? "bg-slate-950 text-slate-50"
          : "bg-slate-50 text-slate-900")
      }
    >
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-4 py-8 md:py-12">
        {/* Header */}
        <header className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-slate-200 text-sm font-semibold uppercase text-slate-900 dark:bg-slate-800 dark:text-slate-50">
              nq
            </div>
            <span className="text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              anotequest
            </span>
          </Link>

          <nav className="flex items-center gap-4 text-sm">
            <a
              href="#how-it-works"
              className="text-slate-700 transition-colors hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
            >
              How it works
            </a>
            <a
              href="#pricing"
              className="text-slate-700 transition-colors hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
            >
              Pricing
            </a>
            <Link
              to="/app"
              className="inline-flex items-center justify-center rounded bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
            >
              Open app
            </Link>
          </nav>
        </header>

        {/* Hero */}
        <section className="mt-20 grid gap-12 md:grid-cols-2 md:items-center">
          <div className="space-y-4">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
              Think spatially. Keep your notes local.
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              A calm, local-first canvas for notes, images, tasks, tables, and sketches.
            </p>
            <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:items-center">
              <Link
                to="/app"
                className="inline-flex items-center justify-center rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
              >
                Open the canvas
              </Link>
              <a
                href="#how-it-works"
                className="text-sm text-slate-700 underline-offset-4 hover:underline dark:text-slate-200"
              >
                See how it works
              </a>
            </div>
          </div>

          <figure className="md:justify-self-end">
            <img
              src="/assets/anotequest-canvas.png"
              alt="AnoteQuest canvas with notes, images, tables, and tasks arranged spatially"
              className="block w-full max-w-md"
            />
          </figure>
        </section>

        {/* Why AnoteQuest */}
        <section id="how-it-works" className="mt-20 space-y-4">
          <h2 className="text-base font-medium text-slate-900 dark:text-slate-50">
            Why AnoteQuest
          </h2>
          <div className="space-y-3">
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-900 dark:text-slate-50">
                Spatial thinking
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Arrange ideas visually instead of folders.
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-900 dark:text-slate-50">
                Local by default
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Notes stay on your device, sync is optional.
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-900 dark:text-slate-50">
                Mixed media
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Text, images, tables, to-dos, and drawing together.
              </p>
            </div>
          </div>
        </section>

        {/* Who it&apos;s for */}
        <section className="mt-16 space-y-2">
          <h2 className="text-base font-medium text-slate-900 dark:text-slate-50">
            Who it&apos;s for
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Developers, designers, students, and thinkers who don&apos;t work in straight linesanyone who
            needs a quiet space to lay out complex ideas.
          </p>
        </section>

        {/* Pricing */}
        <section id="pricing" className="mt-20 space-y-4">
          <h2 className="text-base font-medium text-slate-900 dark:text-slate-50">
            Pricing
          </h2>
          <div className="grid gap-6 text-sm text-slate-700 dark:text-slate-300 md:grid-cols-3">
            <div className="space-y-1">
              <p className="font-medium text-slate-900 dark:text-slate-50">Free</p>
              <p>Try the canvas, up to 100 notes.</p>
            </div>
            <div className="space-y-1">
              <p className="font-medium text-slate-900 dark:text-slate-50">One-time unlock</p>
              <p>Unlimited notes on this device.</p>
            </div>
            <div className="space-y-1">
              <p className="font-medium text-slate-900 dark:text-slate-50">Sync plan</p>
              <p>Optional cloud backup across devices.</p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-20 border-t border-slate-200 pt-6 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap gap-3">
              <span>Local-first by default</span>
              <span>No tracking</span>
              <span>Export anytime</span>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                className="text-sm text-slate-500 underline-offset-4 hover:text-slate-700 hover:underline dark:text-slate-400 dark:hover:text-slate-200"
              >
                Security
              </button>
              <button
                type="button"
                className="text-sm text-slate-500 underline-offset-4 hover:text-slate-700 hover:underline dark:text-slate-400 dark:hover:text-slate-200"
              >
                Terms
              </button>
              <span className="text-slate-500 dark:text-slate-500">&copy; {year} anotequest</span>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
