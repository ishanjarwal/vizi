"use client";

import { Button } from "@/shared/components/shadcn/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/components/shadcn/tooltip";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import * as React from "react";

const emptySubscribe = () => () => {};

export function ThemeToggleButton() {
  const { setTheme, resolvedTheme } = useTheme();
  const mounted = React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  const isDark = mounted && resolvedTheme === "dark";

  const handleToggle = () => {
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <TooltipProvider delayDuration={250}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={handleToggle}
            aria-label={
              isDark ? "Switch to light theme" : "Switch to dark theme"
            }
            className="h-10 w-10 rounded-xl border-border bg-card/95 shadow-md backdrop-blur-md transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            {isDark ? (
              <Sun className="size-4.5 transition-transform" />
            ) : (
              <Moon className="size-4.5 transition-transform" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" sideOffset={8}>
          <span>{isDark ? "Switch to light mode" : "Switch to dark mode"}</span>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
