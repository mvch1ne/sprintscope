import { ThemeToggle } from './primitives/themeToggle';
import { AppLogo } from './primitives/appLogo';

const Header = () => {
  return (
    <header className="h-10 w-full flex justify-items-start items-center p-2.5 border-2">
      <AppLogo />
      <ThemeToggle />
    </header>
  );
};

export { Header };
