"use client";

import { useTheme } from "next-themes";

const Toaster = ({ ...props }: React.ComponentProps<"div">) => {
  const { theme = "system" } = useTheme();

  return (
    <div
      className="toaster group"
      data-theme={theme}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
