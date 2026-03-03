export const Viewport = () => {
  const sectionHeights = {
    header: '1.25rem',
    mainViewport: '1',
    controlSection: '10rem',
  };

  return (
    <div className="viewport-container flex flex-col h-full">
      <header
        style={{ height: sectionHeights.header }}
        className="text-xs flex items-center justify-start border border-t-0 shrink-0"
      >
        <span className="h-full flex justify-center items-center bg-ring py-0.5 px-1">
          VIEWPORT
        </span>
      </header>

      <main className="flex-1 border overflow-hidden">
        <>
          <></>
        </>
      </main>

      <section
        style={{ height: sectionHeights.controlSection }}
        className="border shrink-0"
      >
        <>
          <></>
        </>
      </section>
    </div>
  );
};
