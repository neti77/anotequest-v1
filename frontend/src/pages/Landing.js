import { Link } from "react-router-dom";
import { useTheme } from "next-themes";

export default function Landing() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <main
      className={
        "min-h-screen " +
        (isDark
          ? "bg-slate-950 text-slate-50"
          : "bg-slate-50 text-slate-900")
      }
    >
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col items-start justify-center px-4 py-8">
        <h1 className="text-4xl font-semibold tracking-tight text-slate-900 dark:text-slate-50 sm:text-5xl">
          Welcome to AnoteQuest
        </h1>

        <p className="mt-4 max-w-xl text-sm text-slate-600 dark:text-slate-300">
          Create, edit, and drag notes on a living canvas. Build inspiration boards, mix text with images
          and sketches, and get inspired. A new way to take notes is here.
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link
            to="/app"
            className="inline-flex items-center justify-center rounded bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
          >
            Get started for free
          </Link>
        </div>
      </div>
    </main>
  );
}
