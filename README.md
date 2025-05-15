# SkewT-React

A React component library for rendering SkewT-logP diagrams in meteorological applications.

![SkewT Diagram Example](https://raw.githubusercontent.com/yourusername/skewt-react/main/example/public/skewt-preview.png)

## Installation

```bash
npm install skewt-react
# or
yarn add skewt-react
```

This library requires the following peer dependencies:
- React (>=19.0.0)
- D3.js (>=7.0.0)

## Features

- Interactive SkewT-logP diagram for visualizing atmospheric profiles
- Temperature and dew point line plots
- Wind barbs showing direction and speed
- Customizable diagram options (size, units, etc.)
- Interactive tooltips for data inspection
- Built-in download functionality
- Support for TypeScript

## Basic Usage

```jsx
import React from 'react';
import { SkewT } from 'skewt-react';

// Sample data format
const soundingData = [
  { press: 1000, hght: 111, temp: 25.0, dwpt: 20.0, wdir: 160, wspd: 5 },
  { press: 850, hght: 1537, temp: 14.0, dwpt: 8.0, wdir: 220, wspd: 12 },
  { press: 700, hght: 3100, temp: 2.0, dwpt: -5.0, wdir: 250, wspd: 25 },
  // Additional data points...
];

const App = () => {
  return (
    <div className="chart-container">
      <SkewT
        data={soundingData}
        siteName="Example Station"
        sourceName="Radiosonde Data"
      />
    </div>
  );
};

export default App;
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | `SkewTMeasurement[]` | (required) | Array of measurement points to be displayed |
| `siteName` | `string` | (required) | Name of the site where measurements were taken |
| `sourceName` | `string` | (required) | Source of the data (e.g., "Radiosonde") |
| `width` | `number` | 750 | Width of the chart in pixels |
| `height` | `number` | 620 | Height of the chart in pixels |
| `speedUnit` | `"ms" \| "kt" \| "kmh"` | "kmh" | Unit for wind speed display |
| `className` | `string` | undefined | Custom class name for the SVG element |
| `onDownload` | `(svgString: string) => void` | undefined | Callback function for custom download handling |

## Data Format

The `SkewTMeasurement` type represents a single measurement point in the atmospheric profile:

```typescript
type SkewTMeasurement = {
  // Pressure level in hectopascals (hPa)
  press: number;

  // Height in meters above sea level (optional)
  hght?: number;

  // Temperature in degrees Celsius (optional)
  temp?: number;

  // Dew point temperature in degrees Celsius (optional)
  dwpt?: number;

  // Wind direction in degrees (0-360) (optional)
  wdir?: number;

  // Wind speed in meters per second (optional)
  wspd?: number;
};
```

Only the `press` field is required. The component will intelligently handle missing data, displaying only the available information.

## Advanced Usage

### Customizing Wind Speed Units

```jsx
import React, { useState } from 'react';
import { SkewT, WindSpeedUnit } from 'skewt-react';

const App = () => {
  const [speedUnit, setSpeedUnit] = useState<WindSpeedUnit>('kmh');

  return (
    <div>
      <div className="controls">
        <select
          value={speedUnit}
          onChange={(e) => setSpeedUnit(e.target.value as WindSpeedUnit)}
        >
          <option value="ms">m/s</option>
          <option value="kt">knots</option>
          <option value="kmh">km/h</option>
        </select>
      </div>

      <SkewT
        data={soundingData}
        siteName="Example Station"
        sourceName="Radiosonde Data"
        speedUnit={speedUnit}
      />
    </div>
  );
};
```

### Custom Download Handling

```jsx
import { SkewT } from 'skewt-react';

const App = () => {
  const handleDownload = (svgString) => {
    // Custom download handling
    console.log("SVG string:", svgString);

    // Example: Send to a server
    // fetch('/api/save-chart', {
    //   method: 'POST',
    //   body: JSON.stringify({ svg: svgString }),
    //   headers: { 'Content-Type': 'application/json' }
    // });
  };

  return (
    <SkewT
      data={soundingData}
      siteName="Example Station"
      sourceName="Radiosonde Data"
      onDownload={handleDownload}
    />
  );
};
```

## Utility Functions

The library exports several utility functions that might be useful:

```jsx
import {
  convertWindSpeed,
  getSmallestPressureValue,
  normalizeString
} from 'skewt-react';

// Convert wind speed between units
const speedInKnots = convertWindSpeed(10, 'kt'); // 10 m/s to knots

// Get the minimum pressure value from data
const topPressure = getSmallestPressureValue(soundingData);
```

## Browser Support

This library should work in all modern browsers that support SVG and modern JavaScript features. It has been tested in:

- Chrome (latest)
- Firefox (latest)
- Edge (latest)
- Safari (latest)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built with [D3.js](https://d3js.org/)
- Inspired by traditional SkewT-logP diagrams used in meteorology
- https://github.com/rsobash/d3-skewt
