/**
 * Utility function to clean question titles - removes trailing zeros
 * This is used throughout the application to ensure titles don't display unwanted "0" characters
 */
export function cleanQuestionTitle(title: string | undefined | null): string {
  if (!title) return '';
  let cleaned = String(title).trim();
  
  // Debug logging (remove in production)
  if (cleaned.endsWith('0') && cleaned.length > 1) {
    console.log('Found title ending with 0:', cleaned);
  }
  
  // Remove trailing zeros - be very aggressive
  // This regex removes one or more zeros at the end of the string
  cleaned = cleaned.replace(/0+$/, '');
  
  // Trim again after removing zeros
  cleaned = cleaned.trim();
  
  // Double-check: if it still ends with 0, remove it again (defensive)
  while (cleaned.endsWith('0') && cleaned.length > 1) {
    cleaned = cleaned.slice(0, -1).trim();
  }
  
  if (cleaned !== String(title).trim()) {
    console.log('Cleaned title:', String(title).trim(), '->', cleaned);
  }
  
  return cleaned;
}

