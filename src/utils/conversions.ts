/**
 * Converts wind speed from m/s to a specified unit
 *
 * @param msvalue Wind speed in meters per second
 * @param unit Target unit ("kt" for knots, "kmh" for kilometers per hour, otherwise m/s)
 * @returns Wind speed in the specified unit
 */
export function convertWindSpeed(msvalue: number, unit: string): number {
    switch (unit) {
        case "kt":
            return msvalue * 1.943844492; // m/s to knots
        case "kmh":
            return msvalue * 3.6; // m/s to km/h
        default:
            return msvalue; // keep as m/s
    }
}

/**
 * Normalizes a string by trimming and handling special characters
 *
 * @param input String to normalize
 * @returns Normalized string
 */
export function normalizeString(input: string): string {
    if (!input) return '';
    return input.trim();
}