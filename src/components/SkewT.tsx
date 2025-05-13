import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { SkewTProps, SkewTMeasurement } from '../types';
import {
  getSmallestPressureValue,
  normalizeString
} from '../utils';
import {
  DEFAULT_WIDTH,
  DEFAULT_HEIGHT,
  DEFAULT_MARGIN,
  DEFAULT_BASE_PRESSURE,
  STANDARD_PRESSURE_LINES,
  STANDARD_PRESSURE_TICKS,
  DEFAULT_TEMP_RANGE,
  SKEW_ANGLE,
  DEFAULT_BARB_SIZE,
  DEFAULT_WIND_SPEED_UNIT
} from '../constants';

/**
 * Convert wind speed from m/s to the selected unit
 */
function convertWindSpeed(msvalue: number, unit: string): number {
  switch (unit) {
    case "kt":
      return msvalue * 1.943844492;
    case "kmh":
      return msvalue * 3.6;
    default:
      return msvalue;
  }
}

/**
 * SkewT-logP meteorological diagram component
 */
const SkewT = ({
  data,
  siteName,
  sourceName,
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT,
  speedUnit = DEFAULT_WIND_SPEED_UNIT,
  className,
  onDownload
}: SkewTProps) => {
  // Use separate refs for chart and title like in the original
  const chartRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);

  // Use the same pattern as the original implementation
  useEffect(() => {
    if (chartRef.current && titleRef.current) {
      // Create a D3 chart here
      let wrapper: d3.Selection<SVGSVGElement, unknown, null, undefined> = d3.select(chartRef.current).select('svg');
      if (wrapper.empty()) {
        wrapper = d3.select(chartRef.current)
          .append('svg')
          .attr('id', 'wrapper')
          .attr('width', `${width}px`)
          .attr('height', `${height}px`)
          .attr('class', className || 'skewt-chart');

        // Add title group
        const titleGroup = d3.select(titleRef.current)
          .append('svg')
          .attr('width', `${width}px`)
          .attr('height', '50px')
          .append('g')
          .attr('class', 'title')
          .attr('transform', `translate(${width / 2}, 20)`);

        titleGroup.append('text')
          .attr('text-anchor', 'middle')
          .text(`Site: ${siteName} / Data source: ${normalizeString(sourceName)}`);
      }

      // Setup chart dimensions and constants
      const margin = DEFAULT_MARGIN;
      const w: number = width - margin.left - margin.right;
      const h: number = height - margin.top - margin.bottom - 50; // Leave room for legend
      const deg2rad = Math.PI / 180;
      const tan = Math.tan(SKEW_ANGLE * deg2rad);
      const basep = DEFAULT_BASE_PRESSURE;
      const topp = Math.max(50, getSmallestPressureValue(data) - 10);
      const plines = STANDARD_PRESSURE_LINES;
      const pticks = [...STANDARD_PRESSURE_TICKS, topp];

      // Create scales
      const x: d3.ScaleLinear<number, number> = d3.scaleLinear().range([0, w]).domain(DEFAULT_TEMP_RANGE);
      const y: d3.ScaleLogarithmic<number, number> = d3.scaleLog().range([0, h]).domain([topp, basep]);
      const xAxis = d3.axisBottom(x).tickSize(0).ticks(10);
      const yAxis = d3.axisLeft(y).tickSize(0).tickValues(plines).tickFormat(d3.format(".0d"));
      const yAxis2 = d3.axisRight(y).tickSize(5).tickValues(pticks).tickFormat(d3.format(".0d"));

      // Create the SVG groups
      const container = wrapper.append('g')
        .attr('id', 'container')
        .attr('transform', `translate(${margin.left}, ${margin.top})`);

      const skewtbg = wrapper.append('g')
        .attr('id', 'background')
        .attr('class', 'skewtbg')
        .attr('transform', `translate(${margin.left}, ${margin.top})`);

      const skewtgroup = wrapper.append('g')
        .attr('class', 'skewt')
        .attr('transform', `translate(${margin.left}, ${margin.top})`);

      const barbgroup = wrapper.append('g')
        .attr('class', 'windbarb')
        .style('stroke', '#000')
        .style('stroke-width', '0.75px')
        .style('fill', 'none')
        .attr('transform', `translate(${margin.left}, ${margin.top})`);

      ///////////////////
      // Filter valid data
      const skewtline = data.filter((d: SkewTMeasurement) =>
        typeof d.temp === 'number' && d.temp > -1000 &&
        typeof d.dwpt === 'number' && d.dwpt > -1000
      );
      const skewtlines = [skewtline];

      ///////////////////
      // Draw chart elements
      drawBackground();
      makeWindbarbs();
      drawLines();
      drawLegend();
      addDownloadButton();
      setupTooltips();

      ///////////////////
      // Function implementations

      function drawBackground() {
        // Add clipping path
        skewtbg.append('clipPath')
          .attr('id', 'clipper')
          .append('rect')
          .attr('x', 0)
          .attr('y', 0)
          .attr('width', w)
          .attr('height', h);

        // Skewed temperature lines
        skewtbg.selectAll('templine')
          .data(d3.range(-100, 45, 10))
          .enter().append('line')
          .attr('x1', (d: number) => x(d) - 0.5 + (y(basep) - y(100)) / tan)
          .attr('x2', (d: number) => x(d) - 0.5)
          .attr('y1', 0)
          .attr('y2', h)
          .attr('class', (d: number) => d === 0 ? 'tempzero' : 'gridline')
          .style('stroke', d => d === 0 ? '#aaa' : '#dfdfdf')
          .style('stroke-width', d => d === 0 ? '1.25px' : '0.75px')
          .style('fill', 'none');

        // Logarithmic pressure lines
        skewtbg.selectAll('pressureline')
          .data(plines)
          .enter().append('line')
          .attr('x1', 0)
          .attr('x2', w)
          .attr('y1', (d: number) => y(d))
          .attr('y2', (d: number) => y(d))
          .attr('class', 'gridline')
          .style('stroke', '#dfdfdf')
          .style('stroke-width', '0.75px')
          .style('fill', 'none');

        // Create array to plot dry adiabats
        const pp = d3.range(topp, basep + 1, 10);
        const dryad = d3.range(-30, 240, 20);
        const all: Array<[number, number][]> = [];

        for (let i = 0; i < dryad.length; i++) {
          const z: [number, number][] = [];
          for (let j = 0; j < pp.length; j++) {
            z.push([dryad[i], pp[j]]);
          }
          all.push(z);
        }

        const dryline = d3.line<[number, number]>()
          .x(([d, p]) => {
            const xVal = x(((273.15 + d) / Math.pow((1000 / p), 0.286) - 273.15)) + (y(basep) - y(p)) / tan;
            return isNaN(xVal) ? 0 : xVal;
          })
          .y(([, p]) => y(p));

        // Draw dry adiabats
        skewtbg.selectAll('dryadiabatline')
          .data(all)
          .enter().append('path')
          .attr('class', 'gridline')
          .attr('clip-path', 'url(#clipper)')
          .attr('d', dryline)
          .style('stroke', '#dfdfdf')
          .style('stroke-width', '0.75px')
          .style('fill', 'none');

        // Line along right edge of plot
        skewtbg.append('line')
          .attr('x1', w - 0.5)
          .attr('x2', w - 0.5)
          .attr('y1', 0)
          .attr('y2', h)
          .attr('class', 'gridline')
          .style('stroke', '#dfdfdf')
          .style('stroke-width', '0.75px')
          .style('fill', 'none');

        // Add axes
        skewtbg.append('g')
          .attr('class', 'x axis')
          .attr('transform', `translate(0,${h - 0.5})`)
          .call(xAxis)
          .selectAll('path, line')
          .style('fill', 'none')
          .style('stroke', '#000000')
          .style('stroke-width', '2px')
          .style('shape-rendering', 'crispEdges');

        skewtbg.append('g')
          .attr('class', 'y axis')
          .attr('transform', 'translate(-0.5,0)')
          .call(yAxis)
          .selectAll('path, line')
          .style('fill', 'none')
          .style('stroke', '#000000')
          .style('stroke-width', '2px')
          .style('shape-rendering', 'crispEdges');

        // Add axis labels
        skewtbg.append('text')
          .attr('class', 'x-axis-label')
          .attr('text-anchor', 'middle')
          .attr('x', w / 2)
          .attr('y', h + 30)
          .text('Temperature (°C)');

        skewtbg.append('text')
          .attr('class', 'y-axis-label')
          .attr('text-anchor', 'middle')
          .attr('transform', 'rotate(-90)')
          .attr('x', -h / 2)
          .attr('y', -40)
          .text('Pressure Level (hPa)');

        skewtbg.append('g')
          .attr('class', 'y axis ticks')
          .attr('transform', 'translate(-0.5,0)')
          .call(yAxis2)
          .selectAll('text')
          .style('display', 'block');
      }

      function makeWindbarbs() {
        const speeds: number[] = d3.range(5, 105, 5);
        const barbdef = container.append('defs');

        speeds.forEach((d: number) => {
          const thisbarb = barbdef.append('g').attr('id', 'barb' + d);
          const flags: number = Math.floor(d / 50);
          const pennants: number = Math.floor((d - flags * 50) / 10);
          const halfpennants: number = Math.floor((d - flags * 50 - pennants * 10) / 5);
          let px: number = DEFAULT_BARB_SIZE;

          // Draw wind barb stems
          thisbarb.append('line')
            .attr('x1', 0)
            .attr('x2', 0)
            .attr('y1', 0)
            .attr('y2', DEFAULT_BARB_SIZE);

          // Draw wind barb flags and pennants for each stem
          for (let i = 0; i < flags; i++) {
            thisbarb.append('polyline')
              .attr('points', `0,${px} -10,${px} 0,${px - 4}`)
              .attr('class', 'flag')
              .style('fill', '#000');
            px -= 7;
          }

          // Draw pennants on each barb
          for (let i = 0; i < pennants; i++) {
            thisbarb.append('line')
              .attr('x1', 0)
              .attr('x2', -10)
              .attr('y1', px)
              .attr('y2', px + 4);
            px -= 3;
          }

          // Draw half-pennants on each barb
          for (let i = 0; i < halfpennants; i++) {
            thisbarb.append('line')
              .attr('x1', 0)
              .attr('x2', -5)
              .attr('y1', px)
              .attr('y2', px + 2);
            px -= 3;
          }
        });
      }

      function drawLines() {
        // Draw wind barbs
        const barbs = skewtline.filter((d: SkewTMeasurement) =>
          typeof d.wdir === 'number' && d.wdir >= 0 &&
          typeof d.wspd === 'number' && d.wspd >= 0 &&
          d.press >= topp
        );

        barbgroup.selectAll('barbs')
          .data(barbs)
          .enter()
          .append('use')
          .attr('xlink:href', (d: SkewTMeasurement) => {
            if (typeof d.wspd !== 'number') return '';
            const kts = Math.round(convertWindSpeed(d.wspd, 'kt') / 5) * 5;
            return '#barb' + kts;
          })
          .attr('transform', (d: SkewTMeasurement) => {
            if (typeof d.wdir !== 'number') return '';
            return `translate(${w},${y(d.press)}) rotate(${d.wdir + 180})`;
          });

        // Temperature line
        const templine = d3.line<SkewTMeasurement>()
          .x(d => x(d.temp!) + (y(basep) - y(d.press)) / tan)
          .y(d => y(d.press))
          .defined(d => typeof d.temp === 'number' && d.temp > -1000);

        // Draw temperature lines
        skewtgroup.selectAll('templines')
          .data(skewtlines)
          .enter()
          .append('path')
          .attr('class', (_d, i) => (i < 10) ? 'temp skline' : 'temp mean')
          .attr('clip-path', 'url(#clipper)')
          .attr('d', templine)
          .style('fill', 'none')
          .style('stroke', (_d, i) => i < 10 ? 'red' : 'black')
          .style('stroke-width', (_d, i) => {
            if (i < 10) return '3px';
            else if (i >= 10 && i < 15) return '2.5px';
            else return '1.8px';
          })
          .style('opacity', (_d, i) => i < 10 ? 0.8 : 1);

        // Dew point line
        const dewline = d3.line<SkewTMeasurement>()
          .x(d => x(d.dwpt!) + (y(basep) - y(d.press)) / tan)
          .y(d => y(d.press))
          .defined(d => typeof d.dwpt === 'number' && d.dwpt > -1000);

        // Draw dew point lines
        skewtgroup.selectAll('tempdewlines')
          .data(skewtlines)
          .enter()
          .append('path')
          .attr('class', (_d, i) => (i < 10) ? 'dwpt skline' : 'dwpt mean')
          .attr('clip-path', 'url(#clipper)')
          .attr('d', dewline)
          .style('fill', 'none')
          .style('stroke', (_d, i) => i < 10 ? 'green' : 'black')
          .style('stroke-width', (_d, i) => {
            if (i < 10) return '3px';
            else if (i >= 10 && i < 15) return '2.5px';
            else return '1.8px';
          })
          .style('opacity', (_d, i) => i < 10 ? 0.8 : 1);
      }

      function drawLegend() {
        const legendHeight = 40;
        const legend = wrapper.append('g')
          .attr('class', 'legend')
          .attr('transform', `translate(${w/3}, ${h + margin.top + legendHeight})`);

        legend.append('rect')
          .attr('x', 0)
          .attr('y', 0)
          .attr('width', 10)
          .attr('height', 15)
          .style('fill', 'red');

        legend.append('text')
          .attr('x', 15)
          .attr('y', 10)
          .text('Air Temperature')
          .attr('alignment-baseline', 'middle')
          .style('font-size', '12px');

        legend.append('rect')
          .attr('x', 120)
          .attr('y', 0)
          .attr('width', 10)
          .attr('height', 15)
          .style('fill', 'green');

        legend.append('text')
          .attr('x', 135)
          .attr('y', 10)
          .text('Dew Point Temperature')
          .attr('alignment-baseline', 'middle')
          .style('font-size', '12px');
      }

      function addDownloadButton() {
        const download = () => {
          const element = wrapper.node();
          if (!element) return;

          const serializer = new XMLSerializer();
          const svgStr = serializer.serializeToString(element);

          // If custom download handler is provided, use it
          if (onDownload) {
            onDownload(svgStr);
            return;
          }

          // Default download behavior
          const img = new Image();
          const blob = new Blob([svgStr], { type: 'image/svg+xml' });
          const url = URL.createObjectURL(blob);

          img.src = url;
          img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");

            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
            } else {
              console.error('Canvas context creation failed');
            }

            const imgURL = canvas.toDataURL("image/png");
            const dlLink = document.createElement('a');
            dlLink.download = `SkewT-${siteName}-${sourceName}.png`;
            dlLink.href = imgURL;

            document.body.appendChild(dlLink);
            dlLink.click();
            document.body.removeChild(dlLink);
            URL.revokeObjectURL(url);
          };
        };

        const downloadButton = wrapper.append('g')
          .attr('class', 'download-button')
          .attr('transform', `translate(${w + margin.left + 10}, ${margin.top + 20})`)
          .style('cursor', 'pointer')
          .on('click', download);

        downloadButton.append('rect')
          .attr('width', 30)
          .attr('height', 30)
          .attr('rx', 5)
          .style('fill', '#f0f0f0')
          .style('stroke', '#ccc')
          .style('stroke-width', '1px');

        // Camera icon
        downloadButton.append('path')
          .attr('d', "M15,8.5c-3.59,0-6.5,2.91-6.5,6.5s2.91,6.5,6.5,6.5s6.5-2.91,6.5-6.5S18.59,8.5,15,8.5 M15,20c-2.76,0-5-2.24-5-5s2.24-5,5-5s5,2.24,5,5S17.76,20,15,20 M25,5h-5l-2-2h-6l-2,2H5C3.9,5,3,5.9,3,7v14c0,1.1,0.9,2,2,2h20c1.1,0,2-0.9,2-2V7C27,5.9,26.1,5,25,5")
          .attr('transform', 'translate(1.5, 1.5) scale(0.9)')
          .style('fill', '#333');

        downloadButton.append('title')
          .text('Download SkewT chart as PNG');
      }

      function setupTooltips() {
        const bisectTemp = d3.bisector((d: SkewTMeasurement) => d.press).left;

        // Temperature focus
        const tmpcfocus = skewtgroup.append('g')
          .attr('class', 'focus tmpc')
          .style('display', 'none');

        tmpcfocus.append('circle')
          .attr('r', 4)
          .style('fill', 'red')
          .style('stroke', 'none');

        tmpcfocus.append('text')
          .attr('x', 9)
          .attr('dy', '.35em')
          .style('fill', 'red');

        // Dew point focus
        const dwpcfocus = skewtgroup.append('g')
          .attr('class', 'focus dwpc')
          .style('display', 'none');

        dwpcfocus.append('circle')
          .attr('r', 4)
          .style('fill', 'green')
          .style('stroke', 'none');

        dwpcfocus.append('text')
          .attr('x', -9)
          .attr('text-anchor', 'end')
          .attr('dy', '.35em')
          .style('fill', 'green');

        // Height focus
        const hghtfocus = skewtgroup.append('g')
          .attr('class', 'focus')
          .style('display', 'none');

        hghtfocus.append('text')
          .attr('x', 0)
          .attr('text-anchor', 'start')
          .attr('dy', '.35em')
          .style('font-size', '12px');

        // Wind speed focus
        const wspdfocus = skewtgroup.append('g')
          .attr('class', 'focus windspeed')
          .style('display', 'none');

        wspdfocus.append('text')
          .attr('x', 0)
          .attr('text-anchor', 'start')
          .attr('dy', '.35em')
          .style('font-size', '12px');

        // Add hover overlay
        container.append('rect')
          .attr('class', 'overlay')
          .attr('width', w)
          .attr('height', h)
          .style('fill', 'white')
          .style('opacity', 0)
          .style('pointer-events', 'all')
          .on('mouseover', function () {
            tmpcfocus.style('display', null);
            dwpcfocus.style('display', null);
            hghtfocus.style('display', null);
            wspdfocus.style('display', null);
          })
          .on('mouseout', function () {
            tmpcfocus.style('display', 'none');
            dwpcfocus.style('display', 'none');
            hghtfocus.style('display', 'none');
            wspdfocus.style('display', 'none');
          })
          .on('mousemove', function (event) {
            const coords = d3.pointer(event, this);
            const y0 = y.invert(coords[1]); // get y value of mouse pointer in pressure space

            // Find nearest data point
            const i = bisectTemp(skewtline, y0, 1, skewtline.length - 1);
            if (i <= 0 || i >= skewtline.length) return;

            const d0 = skewtline[i - 1];
            const d1 = skewtline[i];
            const d = Math.abs(y0 - d0.press) < Math.abs(y0 - d1.press) ? d0 : d1;

            // Position temperature focus
            if (typeof d.temp === 'number' && d.temp > -1000) {
              tmpcfocus.attr('transform', `translate(${x(d.temp) + (y(basep) - y(d.press)) / tan},${y(d.press)})`);
              tmpcfocus.select('text').text(`${Math.round(d.temp)}°C`);
              tmpcfocus.style('display', null);
            } else {
              tmpcfocus.style('display', 'none');
            }

            // Position dew point focus
            if (typeof d.dwpt === 'number' && d.dwpt > -1000) {
              dwpcfocus.attr('transform', `translate(${x(d.dwpt) + (y(basep) - y(d.press)) / tan},${y(d.press)})`);
              dwpcfocus.select('text').text(`${Math.round(d.dwpt)}°C`);
              dwpcfocus.style('display', null);
            } else {
              dwpcfocus.style('display', 'none');
            }

            // Position height focus
            hghtfocus.attr('transform', `translate(0,${y(d.press)})`);
            if (typeof d.hght === 'number') {
              hghtfocus.select('text').text(`-- ${Math.round(d.hght)} m`);
              hghtfocus.style('display', null);
            } else {
              hghtfocus.style('display', 'none');
            }

            // Position wind speed focus
            wspdfocus.attr('transform', `translate(${w - 65},${y(d.press)})`);
            if (typeof d.wspd === 'number' && d.wspd >= 0) {
              const speedDisplay = Math.round(convertWindSpeed(d.wspd, speedUnit) * 10) / 10;
              wspdfocus.select('text').text(`${speedDisplay} ${speedUnit}`);
              wspdfocus.style('display', null);
            } else {
              wspdfocus.style('display', 'none');
            }
          });
      }
    }
  }, [data, siteName, sourceName, width, height, speedUnit, className, onDownload]);

  // Return the same simple structure as the original
  return (
    <>
      <div ref={titleRef} className="skewt-title" />
      <div ref={chartRef} className="skewt-chart" />
    </>
  );
};

export default SkewT;