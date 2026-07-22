import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { useForm } from "react-hook-form";
import { useEffect } from "react";

export interface CrudField {
  name: string;
  label: string;
  type?: "text" | "email" | "tel" | "url" | "number" | "textarea";
  placeholder?: string;
  required?: boolean;
  defaultValue?: string;
}

interface CrudDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  fields: CrudField[];
  defaultValues?: Record<string, string>;
  onSubmit: (values: Record<string, string>) => Promise<void>;
  isPending?: boolean;
  submitLabel?: string;
}

export function CrudDialog({
  open,
  onOpenChange,
  title,
  description,
  fields,
  defaultValues,
  onSubmit,
  isPending = false,
  submitLabel = "Save",
}: CrudDialogProps) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: defaultValues || {},
  });

  // Reset form when dialog opens or defaultValues change
  useEffect(() => {
    if (open) {
      reset(defaultValues || {});
    }
  }, [open, defaultValues, reset]);

  const onFormSubmit = async (data: Record<string, string>) => {
    await onSubmit(data);
    if (!isPending) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-sm">
        <DialogHeader>
          <DialogTitle className="text-base font-normal tracking-tight">
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription className="text-xs">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>
        <form onSubmit={handleSubmit(onFormSubmit)}>
          <div className="space-y-4 py-2">
            {fields.map((field) => (
              <div key={field.name} className="space-y-1.5">
                <Label
                  htmlFor={field.name}
                  className="text-xs font-normal text-foreground"
                >
                  {field.label}
                  {field.required && (
                    <span className="text-muted-foreground ml-0.5">*</span>
                  )}
                </Label>
                {field.type === "textarea" ? (
                  <textarea
                    id={field.name}
                    rows={3}
                    {...register(field.name, {
                      required: field.required ? `${field.label} is required` : false,
                    })}
                    placeholder={field.placeholder}
                    className="flex w-full rounded-sm border border-border/70 bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none disabled:opacity-50 resize-none"
                  />
                ) : (
                  <Input
                    id={field.name}
                    type={field.type || "text"}
                    {...register(field.name, {
                      required: field.required ? `${field.label} is required` : false,
                    })}
                    placeholder={field.placeholder}
                    className="h-9 rounded-sm border-border/70 text-sm"
                  />
                )}
                {errors[field.name] && (
                  <p className="text-xs text-destructive">
                    {errors[field.name]?.message as string}
                  </p>
                )}
              </div>
            ))}
          </div>
          <DialogFooter className="mt-4 sm:justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isPending}
              className="bg-foreground text-background hover:bg-foreground/90 rounded-sm text-xs px-4"
            >
              {isPending ? (
                <><Spinner className="mr-1.5 h-3 w-3" /> Saving...</>
              ) : (
                submitLabel
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
