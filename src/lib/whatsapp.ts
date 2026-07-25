/**
 * WhatsApp utility for generating wa.me click-to-chat links
 * and opening WhatsApp with pre-filled messages.
 */

/** Default country code for phone numbers without prefix */
export const DEFAULT_COUNTRY_CODE = "91";

/**
 * Clean a phone number to digits only, stripping spaces, dashes, brackets, etc.
 */
export function cleanPhoneNumber(phone: string): string {
  return phone.replace(/[\s\-\(\)\+]/g, "");
}

/**
 * Extract the raw identifier for WhatsApp from a phone or username.
 * - If it's an email-like string, returns it as-is.
 * - If it's a phone number, strips non-digits and prepends country code
 *   if no leading "+" is present.
 */
export function getWhatsAppIdentifier(
  phone?: string,
  preferredUsername?: string,
  countryCode: string = DEFAULT_COUNTRY_CODE,
): string {
  if (preferredUsername) return preferredUsername;

  if (phone) {
    const cleaned = cleanPhoneNumber(phone);
    if (!cleaned) return "";
    const isEmailLike = phone.includes("@");
    if (isEmailLike) return phone;
    return cleaned.startsWith(countryCode) ? cleaned : `${countryCode}${cleaned}`;
  }

  return "";
}

/**
 * Generate a `https://wa.me/...` click-to-chat link with a pre-filled message.
 *
 * @param phone - Phone number (will be cleaned and country-code-prefixed).
 * @param message - The message text to pre-fill (will be URL-encoded).
 * @param countryCode - Optional country code (default "91" for India).
 * @returns The full wa.me URL, or empty string if phone is invalid.
 */
export function generateWhatsAppLink(
  phone: string,
  message: string,
  countryCode: string = DEFAULT_COUNTRY_CODE,
): string {
  const identifier = getWhatsAppIdentifier(phone, undefined, countryCode);
  if (!identifier) return "";

  const isEmail = identifier.includes("@");
  const base = isEmail
    ? `https://wa.me/?text=${encodeURIComponent(message)}`
    : `https://wa.me/${identifier}?text=${encodeURIComponent(message)}`;

  return base;
}

/**
 * Open WhatsApp in a new tab with a pre-filled message.
 *
 * @param phone - Phone number.
 * @param message - Pre-filled message text.
 * @param countryCode - Optional country code.
 * @returns true if the link was opened, false if phone is invalid.
 */
export function openWhatsApp(
  phone: string,
  message: string,
  countryCode: string = DEFAULT_COUNTRY_CODE,
): boolean {
  const url = generateWhatsAppLink(phone, message, countryCode);
  if (!url) return false;
  window.open(url, "_blank");
  return true;
}
