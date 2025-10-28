import { cn } from "@/lib/utils";
import { ComponentProps } from "react";

export function Badge({
  className,
  ...props
}: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        className
      )}
      {...props}
    />
  );
}
