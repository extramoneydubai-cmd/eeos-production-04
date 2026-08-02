/**
 * useToast — lightweight toast hook backed by sonner.
 *
 * Provides the familiar `useToast()` API (used across EEOS pages):
 *   const { toast } = useToast();
 *   toast({ title, description, variant: "destructive" });
 */

import { useCallback } from "react";
import { toast as sonnerToast } from "sonner";

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastProps {
  title?: string;
  description?: string;
  variant?: "default" | "destructive" | "success" | "warning";
  duration?: number;
  action?: ToastAction;
}

export function useToast() {
  const toast = useCallback((props: ToastProps) => {
    const { title, description, variant = "default", duration, action } = props;
    const options = { description, duration, action: action ? { label: action.label, onClick: action.onClick } : undefined };

    if (variant === "destructive") {
      sonnerToast.error(title ?? "", options);
    } else if (variant === "success") {
      sonnerToast.success(title ?? "", options);
    } else if (variant === "warning") {
      sonnerToast.warning(title ?? "", options);
    } else {
      sonnerToast(title ?? "", options);
    }
  }, []);

  return {
    toast,
    dismiss: (toastId?: string | number) => sonnerToast.dismiss(toastId),
  };
}

export { sonnerToast as toast };
