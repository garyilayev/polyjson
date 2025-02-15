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
