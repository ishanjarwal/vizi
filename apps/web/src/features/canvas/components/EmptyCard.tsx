import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/shared/components/shadcn/card";
import { BRAND_LOGO, BRAND_NAME, BRAND_TAGLINE } from "@/shared/constants";
import { cn } from "@/shared/lib/utils";
import Image from "next/image";
import type { EmptyCardProps as Props } from "../types";

export const EMPTY_CANVAS_TIPS = [
  { label: "Rectangle", shortcut: "R" },
  { label: "Pen", shortcut: "P" },
  { label: "Text", shortcut: "T" },
] as const;

export function EmptyCard({ className }: Props) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 z-10 flex items-center justify-center p-4 select-none",
        className,
      )}
    >
      <Card className="pointer-events-auto w-full max-w-sm rounded-2xl border-border/80 bg-card/90 p-2 text-center shadow-lg backdrop-blur-md transition-shadow hover:shadow-xl">
        <CardHeader className="flex flex-col items-center gap-3 pb-2">
          <div className="relative flex size-24 items-center justify-center">
            <Image
              src={BRAND_LOGO}
              alt={BRAND_NAME}
              width={256}
              height={256}
              priority
              className="size-full object-contain"
            />
          </div>

          <div className="space-y-1">
            <CardDescription className="font-medium text-muted-foreground">
              {BRAND_TAGLINE}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 py-1">
          <p className="text-xs leading-relaxed text-muted-foreground">
            Your canvas is empty. Select a tool from the toolbar above or press
            a shortcut key to start creating and collaborating in real time.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
