/**
   @desc Adds comparison lines to a line or column chart.
   @param chart - DC chart instance.
   @param comparisonLines - Array of comparison lines passed to the chart component.
*/
export function addComparisonLines(chart, comparisonLines) {
    if (!chart || !comparisonLines || !comparisonLines.length) {
        return;
    }

    const chartBody = chart.select('svg > g');

    chart.selectAll('.comparison-line').remove();
    chart.selectAll('.comparison-text').remove();

    if (!(chartBody && chart && chart.y())) {
        return;
    }

    comparisonLines.forEach(line => {
        const lineColor = line.color || '#2CD02C';
        const lineXStart = chart.margins().left;
        const lineXEnd = chart.width() - chart.margins().right;
        const lineY = chart.margins().top + chart.y()(line.value);

        chartBody.append('svg:line')
            .attr('x1', lineXStart)
            .attr('x2', lineXEnd)
            .attr('y1', lineY)
            .attr('y2', lineY)
            .attr('class', 'comparison-line comparison-line-main')
            .style('stroke', lineColor);

        chartBody.append('svg:line')
            .attr('x1', lineXStart)
            .attr('x2', lineXStart)
            .attr('y1', 15 + chart.y()(line.value))
            .attr('y2', 5 + chart.y()(line.value))
            .attr('class', 'comparison-line comparison-line-left')
            .style('stroke', lineColor);

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
    if (!chart || !comparisonLines || !comparisonLines.length) {
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
