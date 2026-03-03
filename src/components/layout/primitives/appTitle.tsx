import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';

export function AppTitle() {
  return (
    <div className="mr-auto">
      <HoverCard openDelay={100} closeDelay={200}>
        <HoverCardTrigger>PROJECT ZERO</HoverCardTrigger>
        <HoverCardContent>
          Sprint Kinematics Analysis by @mach_1_ne
        </HoverCardContent>
      </HoverCard>
    </div>
  );
}
