/**
 * Generates a new RGBA color string (e.g. "rgba(123, 45, 67, 0.5)").
 * @param {number} alpha - The alpha (opacity) value, defaults to 1.
 * @returns {string} A new RGBA color string.
 */
export function generateColor(alpha: number = 1): string {
  const r = Math.floor(Math.random() * 256); // Random number between 0-255
  const g = Math.floor(Math.random() * 256);
  const b = Math.floor(Math.random() * 256);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Darkens an RGBA color by increasing its opacity.
 * @param {string} rgbaColor - The RGBA color string (e.g., "rgba(123, 45, 67, 0.5)").
 * @param {number} increase - The amount to increase the alpha (opacity), cannot exceed 1.
 * @returns {string} The new RGBA color with adjusted opacity.
 */
export function darkenColor(rgbaColor: string, increase: number): string {
  const rgbaRegex = /rgba?\((\d+),\s*(\d+),\s*(\d+),\s*(\d*\.?\d*)\)/;
  const match = rgbaColor.match(rgbaRegex);

  if (!match) {
    throw new Error("Invalid RGBA color format");
  }

  const r = parseInt(match[1], 10);
  const g = parseInt(match[2], 10);
  const b = parseInt(match[3], 10);
  let a = parseFloat(match[4]);

  a = Math.min(a + increase, 1); // Ensure alpha does not exceed 1

  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

/**
 * Generates a new alphanumeric ID.
 * @param {number} length - The desired length of the ID. Defaults to 8.
 * @returns {string} The generated alphanumeric ID.
 */
export function generateId(length: number = 8): string {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}
