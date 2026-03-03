// import { EmptyProject } from '@/components/dashboard/EmptyProject';
import { Viewport } from '../dashboard/viewport/Viewport';
import { Telemetry } from '../dashboard/telemetry/Telemetry';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';

export const Dashboard = () => {
  return (
    <ResizablePanelGroup orientation="horizontal">
      {/* Telemetry Panel */}
      <ResizablePanel defaultSize="20%" minSize="20%" maxSize="30%">
        <Telemetry />
      </ResizablePanel>
      <ResizableHandle withHandle />

      {/* Viewport Panel */}
      <ResizablePanel defaultSize="80%" minSize="70%" maxSize="80%">
        <Viewport />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
};
