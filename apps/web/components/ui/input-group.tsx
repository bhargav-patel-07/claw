import * as React from "react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

function InputGroup({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="input-group"
      className={cn(
        "border-input focus-within:border-ring focus-within:ring-ring/50 flex min-h w-full flex-col transition-[color,box-shadow] focus-within:ring-[3px]",
        className
      )}
      {...props}
    />
  )
}

function InputGroupAddon({
  className,
  align = "block-end",
  ...props
}: React.ComponentProps<"div"> & {
  align?: "block-start" | "block-end" | "center"
}) {
  return (
    <div
      data-slot="input-group-addon"
      data-align={align}
      className={cn(
        "flex w-full",
        align === "block-start" && "items-start",
        align === "block-end" && "items-end",
        align === "center" && "items-center",
        className
      )}
      {...props}
    />
  )
}

function InputGroupButton({
  className,
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button
      data-slot="input-group-button"
      className={cn("shrink-0", className)}
      {...props}
    />
  )
}

export { InputGroup, InputGroupAddon, InputGroupButton }
