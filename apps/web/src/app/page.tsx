import { Button } from "@/shared/components/shadcn/button";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <h1 className="text-4xl font-bold tracking-tight">Vizi</h1>
      <p className="mt-2 text-lg text-muted-foreground">
        Real-time collaborative whiteboard
      </p>
      <Button>Get Started</Button>
    </main>
  );
}
