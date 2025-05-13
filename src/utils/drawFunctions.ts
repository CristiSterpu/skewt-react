import * as d3 from 'd3';
import { SkewTMeasurement } from '../types';
import { convertWindSpeed } from './conversions';

/**
 * Draw the background grid for the SkewT diagram
 */
export function drawBackground(
    skewtbg: d3.Selection<SVGGElement, unknown, null, undefined>,
    w: number,
    h: number,
    x: d3.ScaleLinear<number, number>,
    y: d3.ScaleLogarithmic<number, number>,
    basep: number,
    tan: number,
    plines: number[],
    topp: number,
    xAxis: d3.Axis<number | { valueOf(): number }>,
    yAxis: d3.Axis<number | { valueOf(): number }>,
    yAxis2: d3.Axis<number | { valueOf(): number }>
): void {
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
        .attr('class', (d: number) => d == 0 ? 'tempzero' : 'gridline')
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

    // create array to plot dry adiabats
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
        .attr('transform', 'translate(0,' + (h - 0.5) + ')')
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

/**
 * Draw temperature and dew point lines
 */
export function drawTempDewLines(
    data: SkewTMeasurement[],
    skewtgroup: d3.Selection<SVGGElement, unknown, null, undefined>,
    x: d3.ScaleLinear<number, number>,
    y: d3.ScaleLogarithmic<number, number>,
    basep: number,
    tan: number
): SkewTMeasurement[] {
    const skewtline = data.filter(d =>
        typeof d.temp === 'number' && d.temp > -1000 &&
        typeof d.dwpt === 'number' && d.dwpt > -1000
    );

    const skewtlines = [skewtline];

    // Temperature line generator
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
        .style('stroke-width', (_d, i) => i < 10 ? '3px' : '1.8px')
        .style('opacity', (_d, i) => i < 10 ? 0.8 : 1);

    // Dew point line generator
    const dewpointline = d3.line<SkewTMeasurement>()
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
        .attr('d', dewpointline)
        .style('fill', 'none')
        .style('stroke', (_d, i) => i < 10 ? 'green' : 'black')
        .style('stroke-width', (_d, i) => i < 10 ? '3px' : '1.8px')
        .style('opacity', (_d, i) => i < 10 ? 0.8 : 1);

    return skewtline;
}

/**
 * Add tooltips to the chart
 */
export function setupTooltips(
    data: SkewTMeasurement[],
    skewtgroup: d3.Selection<SVGGElement, unknown, null, undefined>,
    container: d3.Selection<SVGGElement, unknown, null, undefined>,
    w: number,
    h: number,
    y: d3.ScaleLogarithmic<number, number>,
    x: d3.ScaleLinear<number, number>,
    basep: number,
    tan: number,
    unit: string
): void {
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
            const y0 = y.invert(d3.pointer(event, this)[1]); // get y value of mouse pointer in pressure space
            const i = bisectTemp(data, y0, 1, data.length - 1);
            const d0 = data[i - 1];
            const d1 = data[i];
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
                const speedDisplay = Math.round(convertWindSpeed(d.wspd, unit) * 10) / 10;
                wspdfocus.select('text').text(`${speedDisplay} ${unit}`);
                wspdfocus.style('display', null);
            } else {
                wspdfocus.style('display', 'none');
            }
        });
}

/**
 * Draw the legend for the chart
 */
export function drawLegend(
    wrapper: d3.Selection<SVGSVGElement, unknown, null, undefined>,
    w: number,
    h: number
): void {
    const legendHeight = 40;
    const legend = wrapper.append('g')
        .attr('class', 'legend')
        .attr('transform', `translate(${w / 3}, ${h + legendHeight})`);

    // Temperature entry
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

    // Dew point entry
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

/**
 * Helper function to get the smallest pressure value in the data
 */
export function getSmallestPressureValue(measurements: SkewTMeasurement[]): number {
    if (!measurements || !measurements.length) return 100; // Default if no data

    return measurements.reduce((min, current) => {
        return current.press < min ? current.press : min;
    }, measurements[0].press);
}

/**
 * Add download button to the chart
 */
export function addDownloadButton(
    wrapper: d3.Selection<SVGSVGElement, unknown, null, undefined>,
    w: number,
    siteName: string,
    sourceName: string,
    onDownload?: (svgString: string) => void
): void {
    const download = () => {
        const element = wrapper.node();
        if (element) {
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
            const url = window.URL.createObjectURL(blob);

            img.src = url;
            img.onload = () => {
                const canvas = document.createElement("canvas");
                canvas.height = parseInt(wrapper.attr('height') || '700');
                canvas.width = parseInt(wrapper.attr('width') || '500');
                const ctx = canvas.getContext("2d");
                if (ctx) {
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                } else {
                    console.error('Canvas context creation failed');
                }

                const imgURL = canvas.toDataURL("image/png");
                const dlLink = document.createElement('a');
                dlLink.download = `SkewT-${siteName}-${sourceName}.png`;
                dlLink.href = imgURL;
                dlLink.dataset.downloadurl = ["image/png", dlLink.download, dlLink.href].join(':');

                document.body.appendChild(dlLink);
                dlLink.click();
                document.body.removeChild(dlLink);
                window.URL.revokeObjectURL(url);
            };
        }
    };

    const downloadButton = wrapper.append('g')
        .attr('class', 'download-button')
        .attr('transform', `translate(${w + 20},20)`)
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