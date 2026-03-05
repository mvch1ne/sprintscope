export const Telemetry = () => {
  return (
    <div className="telemetry-container">
      <header className="h-5 flex items-center shrink-0 border border-t-0 border-zinc-400 dark:border-zinc-600 bg-white dark:bg-zinc-950 px-3 gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-sky-500" />
        <span className="text-[9px] uppercase tracking-[0.2em] text-zinc-700 dark:text-zinc-300 dark:bg-zinc-950 font-sans">
          Telemetry
        </span>
        <div className="ml-auto flex gap-1">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="w-1 h-1 rounded-full bg-zinc-300 dark:text-zinc-300"
            />
          ))}
        </div>
      </header>
      <main className=""></main>
    </div>
  );
};
