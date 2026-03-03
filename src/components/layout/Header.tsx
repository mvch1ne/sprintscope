import { ThemeToggle } from './primitives/themeToggle';
import { AppLogo } from './primitives/appLogo';

const Header = () => {
  return (
    <header className="min-h-12 w-full flex justify-items-start items-center p-2.5 border-2">
      <AppLogo />
      <ThemeToggle />
    </header>
  );
};

export { Header };
