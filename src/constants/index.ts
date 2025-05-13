/**
 * Default chart dimensions and margins
 */
export const DEFAULT_WIDTH = 750;
export const DEFAULT_HEIGHT = 620;
export const DEFAULT_MARGIN = { top: 30, right: 40, bottom: 20, left: 30 };

/**
 * Default pressure range and lines
 */
export const DEFAULT_BASE_PRESSURE = 1050; // hPa
export const DEFAULT_TOP_PRESSURE = 100; // hPa

/**
 * Standard pressure levels (hPa) for grid lines
 */
export const STANDARD_PRESSURE_LINES = [1000, 850, 700, 500, 300, 200, 100, 50];

/**
 * Standard pressure levels (hPa) for tick marks
 */
export const STANDARD_PRESSURE_TICKS = [950, 850, 750, 650, 550, 450, 350, 250, 150, 50];

/**
 * Default temperature range for x-axis (°C)
 */
export const DEFAULT_TEMP_RANGE = [-70, 50];

/**
 * SkewT angle in degrees
 */
export const SKEW_ANGLE = 55;

/**
 * Default wind barb size in pixels
 */
export const DEFAULT_BARB_SIZE = 25;

/**
 * Wind speed unit options
 */
export type WindSpeedUnit = 'ms' | 'kt' | 'kmh';
export const DEFAULT_WIND_SPEED_UNIT: WindSpeedUnit = 'kmh';