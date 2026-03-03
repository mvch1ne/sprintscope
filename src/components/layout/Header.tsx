import { ThemeToggle } from './primitives/themeToggle';
import { AppTitle } from './primitives/appTitle';

const Header = () => {
  return (
    <header className="min-h-12 mb-2 w-full flex justify-items-start items-center p-2.5 border-2">
      <AppTitle />
      <ThemeToggle />
    </header>
  );
};

export { Header };
