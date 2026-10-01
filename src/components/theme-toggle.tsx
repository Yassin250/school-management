"use client";

import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Moon, Sun } from "lucide-react";
import { useMounted } from "@/hooks/use-mounted";

type ThemeToggleProps = {
  className?: string;
};

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useMounted();

  const isDark = resolvedTheme === "dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn("h-9 w-9", className)}
      aria-label="Toggle theme"
    >
      {!mounted ? (
        <Sun className="h-[1.2rem] w-[1.2rem]" />
      ) : (
        <>
          <Sun
            className={cn(
              "h-[1.2rem] w-[1.2rem] transition-all",
              isDark ? "rotate-90 scale-0" : "rotate-0 scale-100"
            )}
          />
          <Moon
            className={cn(
              "absolute h-[1.2rem] w-[1.2rem] transition-all",
              isDark ? "rotate-0 scale-100" : "-rotate-90 scale-0"
            )}
          />
        </>
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
