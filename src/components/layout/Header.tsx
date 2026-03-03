import { ThemeToggle } from '../misc/themeToggle';

const Header = () => {
  return (
    <header className="w-full flex justify-items-start items-center p-3 border-2">
      <div className="mr-auto">PROJECT ZERO</div>
      <ThemeToggle />
    </header>
  );
};

export { Header };
