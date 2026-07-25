import { Button } from "@/components/ui/button";
import { MessageCircleMore } from "lucide-react";
import { openWhatsApp, generateWhatsAppLink } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";

interface WhatsAppChatButtonProps {
  /** Phone number to send the message to */
  phone?: string;
  /** Pre-filled message text */
  message: string;
  /** Optional label (defaults to "WhatsApp") */
  label?: string;
  /** Icon-only mode (just the icon, no text) */
  iconOnly?: boolean;
  /** Custom CSS class */
  className?: string;
  /** Button size variant */
  size?: "default" | "sm" | "lg" | "icon";
  /** Country code for international numbers (default "91") */
  countryCode?: string;
  /** Called before opening WhatsApp */
  onBeforeOpen?: () => void;
  /** Called after opening WhatsApp */
  onAfterOpen?: () => void;
}

/**
 * One-click WhatsApp chat button.
 *
 * Opens WhatsApp Web/Mobile with a pre-filled message directly —
 * no dialog, no typing needed. Perfect for PDC reminders,
 * payment followups, and any automated outreach.
 */
export default function WhatsAppChatButton({
  phone,
  message,
  label = "WhatsApp",
  iconOnly = false,
  className,
  size = "sm",
  countryCode = "91",
  onBeforeOpen,
  onAfterOpen,
}: WhatsAppChatButtonProps) {
  const isDisabled = !phone || !message;

  const handleClick = () => {
    if (isDisabled || !phone) return;
    onBeforeOpen?.();
    const opened = openWhatsApp(phone, message, countryCode);
    if (opened) onAfterOpen?.();
  };

  // Render as a link for accessibility (opens WhatsApp in new tab)
  const href = !isDisabled && phone
    ? generateWhatsAppLink(phone, message, countryCode)
    : undefined;

  return (
    <Button
      variant="outline"
      size={size}
      disabled={isDisabled}
      onClick={handleClick}
      className={cn(
        "gap-1.5 border-[#25D366]/30 text-[#075E54] hover:bg-[#25D366]/10 hover:border-[#25D366]/50",
        iconOnly && "px-2",
        className,
      )}
      asChild
    >
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => {
          if (!phone) e.preventDefault();
        }}
      >
        <MessageCircleMore className={cn("shrink-0", size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4")} style={{ color: "#25D366" }} />
        {!iconOnly && <span className="text-[11px] font-medium">{label}</span>}
      </a>
    </Button>
  );
}
