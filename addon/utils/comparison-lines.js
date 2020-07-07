import d3Tip from 'd3-tip';
import { isEmpty } from '@ember/utils';

/**
   @desc Adds comparison lines to a line or column chart.
   @param chart - DC chart instance.
   @param comparisonLines - Array of comparison lines passed to the chart component.
*/
export function addComparisonLines(chart, comparisonLines) {
    if (!chart || isEmpty(comparisonLines)) {
        return;
    }

    const chartBody = chart.select('svg > g');

    chart.selectAll('.comparison-line').remove();
    chart.selectAll('.comparison-text').remove();

    if (!(chartBody && chart && chart.y())) {
        return;
    }

    comparisonLines.forEach((line, index) => {
        const lineColor = line.color || '#2CD02C';
        const lineXStart = chart.margins().left;
        const lineXEnd = chart.width() - chart.margins().right;
        const lineY = chart.margins().top + chart.y()(line.value);

        // main comparison line
        chartBody
            .append('svg:line')
            .attr('x1', lineXStart)
            .attr('x2', lineXEnd)
            .attr('y1', lineY)
            .attr('y2', lineY)
            .attr('class', `comparison-line comparison-line-main comparison-line-${index}`)
            .style('stroke', lineColor);

        // hidden tooltip line
        chartBody
            .append('svg:line')
            .data([{ value: line.value, lineIndex: index }])
            .attr('class', 'comparison-line tooltip-line')
            .attr('x1', lineXStart)
            .attr('x2', lineXEnd)
            .attr('y1', lineY)
            .attr('y2', lineY)
            .style('stroke', 'transparent')
            .style('stroke-width', '10px');

        // vertical bar on y-axis
        chartBody.append('svg:line')
            .attr('x1', lineXStart)
            .attr('x2', lineXStart)
            .attr('y1', 15 + chart.y()(line.value))
            .attr('y2', 5 + chart.y()(line.value))
            .attr('class', 'comparison-line comparison-line-left')
            .style('stroke', lineColor);

        // vertical bar on chart righthand side
        chartBody.append('svg:line')
            .attr('x1', lineXEnd)
            .attr('x2', lineXEnd)
            .attr('y1', 15 + chart.y()(line.value))
            .attr('y2', 5 + chart.y()(line.value))
            .attr('class', 'comparison-line comparison-line-right')
            .style('stroke', lineColor);
    });
}

/**
   @desc Adds y-axis ticks for comparison line values to a column or line chart. These will replace any existing y-axis ticks.
   @param {object} chart - DC chart instance.
   @param {array} comparisonLines - Array of comparison lines passed to the chart component.
*/
export function addComparisonLineTicks(chart, comparisonLines) {
    if (!chart || isEmpty(comparisonLines)) {
        return;
    }

    const yAxis = chart.yAxis && chart.yAxis();

    if (!yAxis) {
        return;
    }

    const yAxisTicks = yAxis.ticks && yAxis.ticks();

    if (!yAxisTicks) {
        return;
    }

    yAxisTicks.tickValues(comparisonLines.map(line => line.value));
}

export function addComparisonLineTooltips(chart, formatter) {
    if (chart) {
        const chartDefs = chart.select('svg > defs');

        const tip = d3Tip().attr('class', 'd3-tip comparison-tooltip').html(d => {
            return formatter ? formatter(d.value) : d.value;
        });

        if (!chartDefs.empty()) {
            chartDefs.call(tip);
        }

        chart.selectAll('.comparison-line.tooltip-line')
            .on('mouseover.tip', function (d) {
                const svgLine = chart.select(`.comparison-line-${d.lineIndex}`).node();

                if (svgLine) {
                    tip.show(d, svgLine);
                }
            })
            .on('mouseout.tip', function (d) {
                const svgLine = chart.select(`.comparison-line-${d.lineIndex}`).node();

                if (svgLine) {
                    tip.hide(d, svgLine);
                }
            });
    }
}