import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-[var(--v2-primary)] selection:text-white dark:bg-black/20 border-white/10 flex field-sizing-content min-h-[60px] w-full rounded-xl border px-4 py-3 text-base shadow-xs transition-all outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-[rgba(var(--v2-primary-rgb),0.5)] focus-visible:bg-white/10 focus-visible:ring-0 focus-visible:shadow-[0_0_15px_-5px_var(--v2-primary)]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
