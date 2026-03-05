import { ThemeToggle } from './primitives/themeToggle';
import { AppLogo } from './primitives/appLogo';

const Header = () => {
  return (
    <header className="h-10 w-full flex justify-items-start items-center px-3 border border-zinc-400 dark:border-zinc-600 bg-white dark:bg-zinc-950">
      <AppLogo />
      <div className="ml-auto flex items-center gap-2">
        <div className="flex gap-1">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="w-1 h-1 rounded-full bg-zinc-300 dark:text-zinc-300"
            />
          ))}
        </div>
        <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-950" />
        <ThemeToggle />
      </div>
    </header>
  );
};

export { Header };
