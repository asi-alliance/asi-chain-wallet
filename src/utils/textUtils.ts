/**
 * Truncates text to a specified length, adding ellipsis in the middle
 * @param text - The text to truncate
 * @param maxLength - Maximum length of the truncated text
 * @param ellipsis - The ellipsis character to use (default: '...')
 * @returns Truncated text with ellipsis in the middle
 */
export const truncateText = (text: string, maxLength: number, ellipsis: string = '...'): string => {
  if (!text || text.length <= maxLength) {
    return text;
  }

  if (maxLength <= ellipsis.length) {
    return text.substring(0, maxLength);
  }

  const halfLength = Math.floor((maxLength - ellipsis.length) / 2);
  const start = text.substring(0, halfLength);
  const end = text.substring(text.length - halfLength);
  
  return `${start}${ellipsis}${end}`;
};
