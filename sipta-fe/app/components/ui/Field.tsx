"use client";

import { forwardRef, InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, useId, ReactNode } from "react";
import { cn } from "./cn";

/* --------------------- FormField wrapper --------------------- */

export interface FormFieldProps {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
  htmlFor?: string;
  children: ReactNode;
}

export function FormField({ label, hint, error, required, className, htmlFor, children }: FormFieldProps) {
  const auto = useId();
  const id = htmlFor ?? auto;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <label
          htmlFor={id}
          className="block text-xs font-semibold uppercase tracking-wide text-[var(--sipta-muted-fg)]"
        >
          {label}
          {required && <span className="ml-1 text-[var(--sipta-destructive)]">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p id={errorId} className="text-xs text-[var(--sipta-destructive)]" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-xs text-[var(--sipta-muted-fg)]">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/* --------------------- Input --------------------- */

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
}

const fieldBase =
  "flex w-full items-center rounded-lg bg-[var(--sipta-surface)] transition-colors focus-within:ring-2 focus-within:ring-[var(--sipta-primary)] focus-within:ring-offset-1 focus-within:ring-offset-[var(--sipta-background)]";

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { invalid, leadingIcon, trailingIcon, className, disabled, ...props },
  ref,
) {
  return (
    <div
      className={cn(
        fieldBase,
        "h-10",
        invalid
          ? "border border-[var(--sipta-destructive)]"
          : "border border-[var(--sipta-border)]",
        disabled && "opacity-60",
      )}
    >
      {leadingIcon && (
        <span className="pl-3 text-[var(--sipta-muted-fg)]" aria-hidden="true">
          {leadingIcon}
        </span>
      )}
      <input
        ref={ref}
        aria-invalid={invalid || undefined}
        disabled={disabled}
        className={cn(
          "w-full bg-transparent px-3 text-sm text-[var(--sipta-foreground)] outline-none placeholder:text-[var(--sipta-muted-fg-soft)]",
          className,
        )}
        {...props}
      />
      {trailingIcon && (
        <span className="pr-3 text-[var(--sipta-muted-fg)]" aria-hidden="true">
          {trailingIcon}
        </span>
      )}
    </div>
  );
});

/* --------------------- Select --------------------- */

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { invalid, className, disabled, children, ...props },
  ref,
) {
  return (
    <div
      className={cn(
        fieldBase,
        "h-10",
        invalid
          ? "border border-[var(--sipta-destructive)]"
          : "border border-[var(--sipta-border)]",
        disabled && "opacity-60",
      )}
    >
      <select
        ref={ref}
        disabled={disabled}
        aria-invalid={invalid || undefined}
        className={cn(
          "w-full appearance-none bg-transparent px-3 pr-9 text-sm text-[var(--sipta-foreground)] outline-none",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute right-3 h-4 w-4 text-[var(--sipta-muted-fg)]"
        style={{ position: "absolute", right: "0.75rem" }}
        viewBox="0 0 20 20"
        fill="none"
      >
        <path
          d="M6 8l4 4 4-4"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
});

/* --------------------- Textarea --------------------- */

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { invalid, className, disabled, rows = 4, ...props },
  ref,
) {
  return (
    <div
      className={cn(
        "rounded-lg bg-[var(--sipta-surface)] focus-within:ring-2 focus-within:ring-[var(--sipta-primary)]",
        invalid
          ? "border border-[var(--sipta-destructive)]"
          : "border border-[var(--sipta-border)]",
        disabled && "opacity-60",
      )}
    >
      <textarea
        ref={ref}
        rows={rows}
        aria-invalid={invalid || undefined}
        disabled={disabled}
        className={cn(
          "block w-full resize-y bg-transparent px-3 py-2 text-sm text-[var(--sipta-foreground)] outline-none placeholder:text-[var(--sipta-muted-fg-soft)]",
          className,
        )}
        {...props}
      />
    </div>
  );
});
