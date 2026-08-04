"use client";

/* Simple, unopinionated Table primitives that wrap raw HTML table elements
 * with tokenized styling. Data logic remains up to the caller. */

import { HTMLAttributes, ThHTMLAttributes, TdHTMLAttributes, TableHTMLAttributes } from "react";
import { cn } from "./cn";

export function Table({ className, ...props }: TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div
      className="overflow-x-auto rounded-xl border border-[var(--sipta-border)] bg-[var(--sipta-surface)]"
    >
      <table
        className={cn("w-full border-collapse text-left text-sm", className)}
        {...props}
      />
    </div>
  );
}

export function THead({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      className={cn(
        "bg-[var(--sipta-surface-2)] text-[11px] font-semibold uppercase tracking-wide text-[var(--sipta-muted-fg)]",
        className,
      )}
      {...props}
    />
  );
}

export function TBody({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody
      className={cn("divide-y divide-[var(--sipta-border)]", className)}
      {...props}
    />
  );
}

export function TR({ className, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn("transition-colors hover:bg-[var(--sipta-surface-2)]", className)}
      {...props}
    />
  );
}

export function TH({ className, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      scope="col"
      className={cn("px-4 py-3 font-semibold", className)}
      {...props}
    />
  );
}

export function TD({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={cn("px-4 py-3 text-[var(--sipta-foreground)]", className)}
      {...props}
    />
  );
}
