import * as d3 from 'd3';
import { convertWindSpeed } from './conversions';

/**
 * Creates wind barb symbols and adds them to the specified container
 *
 * @param container D3 selection for the container to add barbs to
 * @param barbsize Size of the wind barbs in pixels
 */
export function makeWindbarbs(container: d3.Selection<SVGGElement, unknown, null, undefined>, barbsize: number): void {
    const speeds: number[] = d3.range(5, 105, 5);
    const barbdef = container.append('defs');

    speeds.forEach((d: number) => {
        const thisbarb = barbdef.append('g').attr('id', 'barb' + d);
        const flags: number = Math.floor(d / 50);
        const pennants: number = Math.floor((d - flags * 50) / 10);
        const halfpennants: number = Math.floor((d - flags * 50 - pennants * 10) / 5);
        let px: number = barbsize;

        // Draw wind barb stems
        thisbarb.append('line')
            .attr('x1', 0)
            .attr('x2', 0)
            .attr('y1', 0)
            .attr('y2', barbsize);

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

/**
 * Adds wind barbs to the barb group for each data point
 *
 * @param data Array of data points with wind information
 * @param topp Minimum pressure value for display
 * @param barbgroup D3 selection for the barb group element
 * @param w Width of the chart
 * @param y D3 scale for the y-axis (pressure)
 */
export function drawWindBarbs(
    data: Array<{ press: number, wdir?: number, wspd?: number }>,
    topp: number,
    barbgroup: d3.Selection<SVGGElement, unknown, null, undefined>,
    w: number,
    y: d3.ScaleLogarithmic<number, number>
): void {
    // Filter for valid wind data
    const barbs = data.filter(d =>
        typeof d.wdir === 'number' &&
        typeof d.wspd === 'number' &&
        d.wdir >= 0 &&
        d.wspd >= 0 &&
        d.press >= topp
    );

    // Draw the barbs
    barbgroup.selectAll('barbs')
        .data(barbs)
        .enter()
        .append('use')
        .attr('xlink:href', (d) => {
            const kts = Math.round(convertWindSpeed(d.wspd!, 'kt') / 5) * 5; // convert to knots, round to nearest 5
            return '#barb' + kts;
        })
        .attr('transform', (d) => `translate(${w},${y(d.press)}) rotate(${d.wdir! + 180})`);
}