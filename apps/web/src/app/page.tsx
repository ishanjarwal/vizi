import {
  BottomLeftOptions,
  EmptyCard,
  Toolbar,
  TopLeftMenu,
  TopRightMenu,
} from "@/features/canvas";

export default function Home() {
  return (
    <main className="relative flex h-screen w-screen overflow-hidden bg-background">
      {/* Top Left Menu */}
      <TopLeftMenu />

      {/* Top Centered Header Toolbar */}
      <Toolbar />

      {/* Top Right Menu */}
      <TopRightMenu />

      {/* Center Empty Canvas State Card */}
      <EmptyCard />

      {/* Bottom Left Controls */}
      <BottomLeftOptions />

      {/* Infinite Canvas Background Surface */}
      <div
        className="h-full w-full bg-[radial-gradient(var(--primary)_1px,transparent_1px)] bg-size-[24px_24px] opacity-70"
        aria-hidden="true"
      />
    </main>
  );
}
