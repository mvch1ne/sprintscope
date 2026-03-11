import { useState, useEffect } from 'react';
import { HelpCircle } from 'lucide-react';
import { ThemeToggle } from './primitives/themeToggle';
import { AppLogo } from './primitives/appLogo';
import { HelpModal } from './HelpModal';
import { isHelpDismissed, dismissHelp, undismissHelp } from './helpModalStore';

const Header = () => {
  const [helpOpen, setHelpOpen] = useState(false);
  // showOnStartup = true means the modal WILL appear next time (i.e. not dismissed)
  const [showOnStartup, setShowOnStartup] = useState(!isHelpDismissed());

  // Auto-open on first visit (when not previously dismissed)
  useEffect(() => {
    if (!isHelpDismissed()) setHelpOpen(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleToggleShowOnStartup = (checked: boolean) => {
    setShowOnStartup(checked);
    if (checked) undismissHelp();
    else dismissHelp();
  };

  const handleClose = () => {
    setHelpOpen(false);
  };

  return (
    <header className="h-10 w-full flex justify-items-start items-center px-3 border border-zinc-400 dark:border-zinc-600 bg-white dark:bg-zinc-950">
      <AppLogo />
      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={() => setHelpOpen(true)}
          title="Help & getting started"
          className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
        >
          <HelpCircle size={15} />
        </button>
        <ThemeToggle />
      </div>

      <HelpModal
        isOpen={helpOpen}
        onClose={handleClose}
        showOnStartup={showOnStartup}
        onToggleShowOnStartup={handleToggleShowOnStartup}
      />
    </header>
  );
};

export { Header };
