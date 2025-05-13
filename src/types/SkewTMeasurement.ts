/**
 * Represents a single measurement point in a SkewT diagram
 */
export type SkewTMeasurement = {
    /**
     * Pressure level in hectopascals (hPa)
     */
    press: number;

    /**
     * Height in meters above sea level
     */
    hght?: number;

    /**
     * Temperature in degrees Celsius
     */
    temp?: number;

    /**
     * Dew point temperature in degrees Celsius
     */
    dwpt?: number;

    /**
     * Wind direction in degrees (0-360)
     */
    wdir?: number;

    /**
     * Wind speed in meters per second
     */
    wspd?: number;
};

/**
 * Configuration options for the SkewT component
 */
export interface SkewTProps {
    /**
     * Array of measurement points to be displayed in the SkewT diagram
     */
    data: SkewTMeasurement[];

    /**
     * Name of the site where the measurements were taken
     */
    siteName: string;

    /**
     * Source of the data (e.g., "Radiosonde", "Model", etc.)
     */
    sourceName: string;

    /**
     * Width of the chart in pixels
     * @default 750
     */
    width?: number;

    /**
     * Height of the chart in pixels
     * @default 620
     */
    height?: number;

    /**
     * Unit for wind speed display
     * @default "kmh"
     */
    speedUnit?: "ms" | "kt" | "kmh";

    /**
     * Custom class name for the SVG element
     */
    className?: string;

    /**
     * Callback function called when download is clicked
     */
    onDownload?: (svgString: string) => void;
}