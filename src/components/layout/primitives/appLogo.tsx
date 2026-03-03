import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import Logo from '@/assets/Images/logo.svg';

export function AppLogo() {
  return (
    <div className="mr-auto">
      <HoverCard openDelay={100} closeDelay={200}>
        <HoverCardTrigger>
          <img src={Logo} alt="" className="inline" />
          <span className="text-[12px]"> SprintScope </span>
        </HoverCardTrigger>
        <HoverCardContent className="ml-1.5">
          Sprint Kinematics Analysis by @mach_1_ne
        </HoverCardContent>
      </HoverCard>
    </div>
  );
}
