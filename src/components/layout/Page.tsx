// This is where the entire program will be run
import { EmptyProject } from '@/components/dashboard/EmptyProject';

export const Page = () => {
  const flag = true;
  return flag ? <EmptyProject /> : <></>;
  //   return (
  //     <>

  //     </>
  //   );
};
