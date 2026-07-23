import { useDeveloperMode } from "@/contexts/DeveloperModeContext";

/**
 * DevModeOverlay — shows page metadata info when Developer Mode is on.
 * The overlay is rendered directly inside DeveloperModeProvider and
 * doesn't need a separate component mount point.
 *
 * This file is kept for reference and future extensibility.
 * The actual overlay is rendered inline in DeveloperModeProvider.
 */
export default function DevModeOverlay() {
  // The overlay is rendered inside DeveloperModeProvider as a portal-like fixed div.
  // This component is a no-op placeholder for potential future enhancements.
  return null;
}
