import ChartSizes from 'ember-data-visualizations/utils/chart-sizes';

/**
   @desc Adds comparison lines to a line or column chart.
   @param chart - DC chart instance.
   @param comparisonLines - Array of comparison lines passed to the chart component.
*/
export function addComparisonLines(chart, comparisonLines) {
    if (!chart || !comparisonLines) {
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
        const lineXStart = ChartSizes.COMPARISON_LABEL_WIDTH;
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

        chartBody.append('text')
            .text(line.displayValue)
            .attr('x', lineXStart - ChartSizes.COMPARISON_LABEL_PAD)
            .attr('y', 14 + chart.y()(line.value))
            .attr('text-anchor', 'end')
            .attr('font-size', '12px')
            .attr('class', 'comparison-text')
            .attr('fill', line.textColor || '#000000');
    });
}
