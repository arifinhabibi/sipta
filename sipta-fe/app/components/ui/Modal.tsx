"use client";

import { XMarkIcon } from "@heroicons/react/24/outline";
import { useEffect, useId } from "react";
import { Button } from "./Button";
import { cn } from "./cn";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg";
  /** Prevent close-on-overlay-click; useful for destructive confirmations. */
  dismissable?: boolean;
  /** Optional data-testid on the dialog surface. */
  testId?: string;
}

const sizeMap: Record<NonNullable<ModalProps["size"]>, string> = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
};

/**
 * Accessible modal primitive. Traps escape-to-close, restores body scroll,
 * exposes `role="dialog"` + `aria-modal` + labelledby wiring.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  dismissable = true,
  testId,
}: ModalProps) {
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && dismissable) onClose();
    };
    window.addEventListener("keydown", handler);
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = previous;
    };
  }, [open, onClose, dismissable]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 animate-fade-in"
      style={{
        background:
          "color-mix(in oklch, var(--sipta-foreground) 45%, transparent)",
      }}
    >
      {dismissable && (
        <button
          type="button"
          className="absolute inset-0 cursor-default"
          onClick={onClose}
          aria-label="Tutup dialog"
          tabIndex={-1}
        />
      )}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descId : undefined}
        className={cn(
          "relative z-10 w-full overflow-hidden rounded-2xl",
          sizeMap[size],
        )}
        style={{
          background: "var(--sipta-surface-elevated)",
          border: "1px solid var(--sipta-border)",
          boxShadow: "var(--shadow-xl)",
        }}
        data-testid={testId}
      >
        {title && (
          <div
            className="flex items-start justify-between gap-3 p-5"
            style={{ borderBottom: "1px solid var(--sipta-border)" }}
          >
            <div className="min-w-0">
              <h2
                id={titleId}
                className="text-base font-semibold text-[var(--sipta-foreground)]"
                style={{ fontFamily: "var(--font-display-family)" }}
              >
                {title}
              </h2>
              {description && (
                <p
                  id={descId}
                  className="mt-1 text-sm text-[var(--sipta-muted-fg)]"
                >
                  {description}
                </p>
              )}
            </div>
            {dismissable && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                aria-label="Tutup dialog"
                data-testid="modal-close-button"
              >
                <XMarkIcon className="h-5 w-5" />
              </Button>
            )}
          </div>
        )}

        <div className="p-5">{children}</div>

        {footer && (
          <div
            className="flex flex-col-reverse items-stretch gap-2 p-5 sm:flex-row sm:items-center sm:justify-end"
            style={{ borderTop: "1px solid var(--sipta-border)" }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
