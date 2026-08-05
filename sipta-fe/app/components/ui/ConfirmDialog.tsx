"use client";

import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "./Button";
import { Modal } from "./Modal";

export type ConfirmDialogTone = "primary" | "warning" | "destructive";

export interface ConfirmDialogOptions {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmDialogTone;
  testId?: string;
}

export interface ConfirmDialogProps extends ConfirmDialogOptions {
  open: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const toneConfig = {
  primary: {
    icon: CheckCircleIcon,
    iconBackground: "var(--sipta-primary-subtle)",
    iconColor: "var(--sipta-primary)",
    buttonVariant: "primary" as const,
  },
  warning: {
    icon: ExclamationTriangleIcon,
    iconBackground: "var(--sipta-warning-subtle)",
    iconColor: "var(--sipta-warning)",
    buttonVariant: "primary" as const,
  },
  destructive: {
    icon: InformationCircleIcon,
    iconBackground: "var(--sipta-destructive-subtle)",
    iconColor: "var(--sipta-destructive)",
    buttonVariant: "destructive" as const,
  },
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Ya, lanjutkan",
  cancelLabel = "Batal",
  tone = "primary",
  testId = "confirm-dialog",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const config = toneConfig[tone];
  const Icon = config.icon;

  return (
    <Modal
      open={open}
      onClose={onCancel}
      size="sm"
      dismissable={!loading}
      testId={testId}
      footer={
        <>
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={loading}
            data-testid={`${testId}-cancel`}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={config.buttonVariant}
            onClick={onConfirm}
            loading={loading}
            data-testid={`${testId}-confirm`}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
          style={{
            background: config.iconBackground,
            color: config.iconColor,
          }}
          aria-hidden="true"
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-[var(--sipta-foreground)]">
            {title}
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-[var(--sipta-muted-fg)]">
            {description}
          </p>
        </div>
      </div>
    </Modal>
  );
}

interface PendingConfirmation extends ConfirmDialogOptions {
  resolve: (confirmed: boolean) => void;
}

export function useConfirmDialog() {
  const [pending, setPending] = useState<PendingConfirmation | null>(null);
  const pendingRef = useRef<PendingConfirmation | null>(null);

  const close = useCallback((confirmed: boolean) => {
    const current = pendingRef.current;
    pendingRef.current = null;
    setPending(null);
    current?.resolve(confirmed);
  }, []);

  const confirm = useCallback((options: ConfirmDialogOptions) => {
    pendingRef.current?.resolve(false);

    return new Promise<boolean>((resolve) => {
      const request = { ...options, resolve };
      pendingRef.current = request;
      setPending(request);
    });
  }, []);

  useEffect(() => {
    return () => pendingRef.current?.resolve(false);
  }, []);

  return {
    confirm,
    confirmationDialog: (
      <ConfirmDialog
        open={Boolean(pending)}
        title={pending?.title ?? "Konfirmasi"}
        description={pending?.description ?? ""}
        confirmLabel={pending?.confirmLabel}
        cancelLabel={pending?.cancelLabel}
        tone={pending?.tone}
        testId={pending?.testId}
        onConfirm={() => close(true)}
        onCancel={() => close(false)}
      />
    ),
  };
}
