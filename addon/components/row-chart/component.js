import dc from 'dc';
import crossfilter from 'crossfilter';
import BaseChartComponent from '../base-chart-component';
import d3Tip from 'd3-tip';
import d3 from 'd3';

/**
   @public
   @module row-chart
   @type component
   @desc dc.js row chart
*/
export default BaseChartComponent.extend({
    classNames: ['row-chart'],

    showMaxMin: false,
    showComparisonLine: false,
    currentInterval: null,
    showCurrentIndicator: false,
    maxMinSeries: null,

    // Vertical line to mark a target, average, or any kind of comparison value
    // Ex. { value: 0.8, displayValue: '80%', color: '#2CD02C' }
    comparisonLine: null,

    buildChart() {
        let rowChart = dc.rowChart(`#${this.get('elementId')}`);

        let labels = [];
        this.get('group')[0].all().forEach(d => labels.push(d.key));
        const labelWidth = Math.max(...(labels.map(el => el.length))) * 8;
        const tickWidth = 15;
        const legendWidth = this.get('legendWidth') || 250;
        const rightMargin = this.get('showLegend') ? legendWidth : 5;

        rowChart
            .transitionDuration(0)
            .elasticX(true)
            .group(this.get('group')[0])
            .dimension(this.get('dimension'))
            .ordering(d => d.key)
            .colors(this.get('colors')[0])
            .height(this.get('height'))
            .renderLabel(false)
            .renderTitle(false)
            .margins({
                top: 5,
                right: rightMargin,
                bottom: 20,
                left: labelWidth + tickWidth
            });

        if (this.get('width')) {
            rowChart.width(this.get('width'));
        }

        if (this.get('xAxis') && this.get('xAxis').ticks) {
            rowChart.xAxis().ticks(this.get('xAxis').ticks);
        }

        rowChart.on('pretransition', chart => {
            // add x class to x axis
            chart.select('.axis').attr('class', 'axis x');
            // hide x axis grid lines
            if (this.get('hideXAxisLines')) {
                chart.select('svg').selectAll('g.tick > line.grid-line').filter(d => d !== 0.0).remove();
            }
            this.addYAxis(chart, tickWidth);
        });

        const tip = this.createTooltip();

        rowChart.on('renderlet', chart => this.onRenderlet(chart, tip, tickWidth));
        this.set('chart', rowChart);
    },

    createTooltip() {
        return d3Tip().attr('class', 'd3-tip')
            .style('text-align', 'center')
            .attr('id', this.get('elementId'))
            .html(d => `<span class="row-tip-key">${d.key}</span><br/><span class="row-tip-value">${d.value}</span>`)
            .direction('e');
    },

    onRenderlet(chart, tip) {
        let labels = document.querySelector(`#${this.get('elementId')} .inline-labels`);
        if (labels) {
            labels.remove();
        }

        if (this.get('showMaxMin')) {
            this.addMaxMinLabels(chart.selectAll('g.row > rect')._groups[0]);
        }
        if (this.get('showComparisonLine') && this.get('comparisonLine')) {
            this.addComparisonLine(chart);
        }

        if (this.get('showLegend')) {
            chart.select('g.legend').remove();
            const legendDimension = 18;
            let legendG = chart.select('g')
                .append('g')
                .attr('transform', `translate(${chart.effectiveWidth() + 50},${chart.effectiveHeight() / 4})`);
            this.addLegend(chart, this.getLegendables(chart), legendG, legendDimension);
        }

        this.addClickHandlersAndTooltips(chart.select('svg'), tip, 'g.row > rect');
    },

    getLegendables(chart) {
        let legendables = [];
        let alreadyDone = [];
        for (let i = 0; i < chart.data().length; i++) {
            if (alreadyDone.indexOf(chart.data()[i].key) === -1) {
                let legendable = {};
                legendable.title = chart.data()[i].key;
                legendable.color = chart.getColor(chart.data()[i]);
                legendable.elements = chart.selectAll('g.row > rect').filter(d => d.key === legendable.title);
                legendables.push(legendable);
                alreadyDone.push(chart.data()[i].key);
            }
        }
        return legendables;
    },

    addYAxis(chart, tickWidth) {
        let yAxisG = chart.select('svg > g').append('g').attr('class', 'axis y');

        let labels = [];
        this.get('group')[0].all().forEach(d => labels.push(d.key));
        const barHeight = chart.select('svg g.row > rect').attr('height');
        const getYValue = i => barHeight * (i + .5) + ((i + 1) * chart.gap());

        // add labels to corresponding bar groups and move them appropriately
        if (yAxisG.selectAll('g.tick').empty()) {
            // create tick groups
            let tickGs = yAxisG.selectAll('g')
                .data(labels)
                .enter()
                .append('g')
                .attr('class', 'tick');

            // add labels to tick groups
            tickGs.append('text')
                .text(d => d)
                .attr('y', (d, i) => getYValue(i))
                .attr('dy', '.35em')
                .attr('x', function () {
                    return -1 * d3.select(this).text().length * 8 - tickWidth;
                });
        }

        // add y ticks and grid lines
        let ticksGroups = yAxisG.selectAll('g.tick');

        if (this.get('showYTicks')) {
            ticksGroups.append('line')
                .attr('x1', 0)
                .attr('x2', -6)
                .attr('y1', (d, i) => getYValue(i))
                .attr('y2', (d, i) => getYValue(i))
                .attr('class', 'yTick');
        }

        if (this.get('showYGridLines')) {
            ticksGroups.append('line')
                .attr('x1', 0)
                .attr('x2', chart.effectiveWidth())
                .attr('y1', (d, i) => getYValue(i))
                .attr('y2', (d, i) => getYValue(i))
                .attr('class', 'y grid-line');
            yAxisG.lower();
        }
    },

    addComparisonLine(chart) {
        const chartBody = d3.select('.row-chart > svg > g');
        const line = this.get('comparisonLine');

        chart.selectAll('.comparison-line').remove();
        chart.selectAll('.comparison-text').remove();
        const lineG = chartBody.append('g').attr('class', 'comparisonLine');

        lineG.append('line')
            .attr('y1', 1)
            .attr('y2', chart.effectiveHeight())
            .attr('x1', chart.x()(line.value))
            .attr('x2', chart.x()(line.value))
            .attr('class', 'comparison-line')
            .style('stroke', line.color || '#2CD02C');

        lineG.append('line')
            .attr('y1', 1)
            .attr('y2', 1)
            .attr('x1', chart.x()(line.value) + 5)
            .attr('x2', chart.x()(line.value) - 5)
            .attr('class', 'comparison-line')
            .style('stroke', line.color || '#2CD02C');

        lineG.append('line')
            .attr('y1', chart.effectiveHeight())
            .attr('y2', chart.effectiveHeight())
            .attr('x1', chart.x()(line.value) + 5)
            .attr('x2', chart.x()(line.value) - 5)
            .attr('class', 'comparison-line')
            .style('stroke', line.color || '#2CD02C');

        lineG.append('text')
            .text(line.displayValue)
            .attr('y', chart.effectiveHeight() + 15)
            .attr('x', chart.x()(line.value))
            .attr('text-anchor', 'middle')
            .attr('font-size', '12px')
            .attr('class', 'comparison-text')
            .attr('fill', line.textColor || '#000000');
    },

    addMaxMinLabels(bars) {
        let formatter = this.get('xAxis.formatter') || (value => value);
        let maxValue, maxIdx, minValue, minIdx, values, nonZeroValues;
        let g = this.get('group')[0];
        values = g.all().map(gElem => gElem.value);
        nonZeroValues = values.filter(v => v > 0);
        maxValue = Math.max(...nonZeroValues);
        maxIdx = values.indexOf(maxValue);
        maxValue = formatter(maxValue);
        minValue = Math.min(...nonZeroValues);
        minIdx = values.indexOf(minValue);
        minValue = formatter(minValue);
        let gLabels = this.get('chart').select('svg > g').append('g').attr('class', 'inline-labels');
        let b = bars[maxIdx];

        // Choose the longest bar in the stack (largest width value) and place the max/min labels to the right of that.
        // Avoids label falling under any bar in the stack.
        let yValues = [];
        this.get('chart').selectAll('g.row > rect').each(function () {
            yValues.push(parseInt(d3.select(this).attr('width')));
        });
        const maxLabelY = Math.max(...yValues) + 25;

        if (b) {
            gLabels.append('text')
                .text(maxValue)
                .attr('transform', b.parentNode.getAttribute('transform'))
                .attr('x', Math.max(12, maxLabelY - 2) + 5)
                .attr('y', +b.getAttribute('y') + (b.getAttribute('height') / 2) + 3)
                .attr('text-anchor', 'middle')
                .attr('font-size', '12px')
                .attr('class', 'max-value-text');

            if (!(maxIdx === minIdx)) {
                gLabels.append('text')
                    // unicode for font-awesome caret right
                    .attr('transform', b.parentNode.getAttribute('transform'))
                    .html(() => '&#xf0da')
                    .attr('text-anchor', 'middle')
                    .attr('class', 'caret-icon max-value-indicator')
                    .attr('y', +b.getAttribute('y') + (b.getAttribute('height') / 2) + 3)
                    .attr('x', maxLabelY - 12);
            }
        }
        b = bars[minIdx];

        if (b && !(maxIdx === minIdx)) {
            gLabels.append('text')
                .text(minValue)
                .attr('transform', b.parentNode.getAttribute('transform'))
                .attr('x', Math.max(12, maxLabelY - 2) + 5)
                .attr('y', +b.getAttribute('y') + (b.getAttribute('height') / 2) + 3)
                .attr('text-anchor', 'middle')
                .attr('font-size', '12px')
                .attr('class', 'min-value-text');

            gLabels.append('text')
                // unicode for font-awesome caret left
                .html(() => '&#xf0d9')
                .attr('transform', b.parentNode.getAttribute('transform'))
                .attr('class', 'caret-icon min-value-indicator')
                .attr('text-anchor', 'middle')
                .attr('y', +b.getAttribute('y') + (b.getAttribute('height') / 2) + 3)
                .attr('x', maxLabelY - 12);
        }
    },
    showChartNotAvailable() {
        const chartNotAvailableMessage = this.get('chartNotAvailableMessage');
        const chartNotAvailableColor = this.get('chartNotAvailableColor');
        const chartNotAvailableTextColor = this.get('chartNotAvailableTextColor');

        let rowChart = dc.rowChart(`#${this.get('elementId')}`);
        this.set('chart', rowChart);

        let data = [];
        for (let i = 1; i <= this.get('chartNotAvailableBars'); i++) {
            data.push({ label: i });
        }
        const filter = crossfilter(data);
        const dimension = filter.dimension(d => d.label);
        const group = dimension.group().reduceCount();

        rowChart
            .colors(chartNotAvailableColor)
            .renderTitle(false)
            .renderLabel(false)
            .height(this.get('height'))
            .group(group)
            .dimension(dimension)
            .transitionDuration(0);

        if (this.get('width')) {
            rowChart.width(this.get('width'));
        }

        const labelWidth = 100;
        const totalWidth = rowChart.width();
        const chartWidth = totalWidth - labelWidth;
        rowChart.width(chartWidth);

        if (this.get('xAxis') && this.get('xAxis').ticks) {
            rowChart.xAxis().ticks(this.get('xAxis').ticks);
        }

        rowChart.on('pretransition', chart => {
            // This is outside the Ember run loop so check if component is destroyed
            if (this.get('isDestroyed') || this.get('isDestroying')) {
                return;
            }

            // move it the same distance over as it would be if it did have labels (for consistency)
            chart.select('svg').attr('width', totalWidth);
            chart.select('svg > g').attr('transform', `translate(${labelWidth},0)`).attr('width', totalWidth);

            let svg = chart.select('svg');

            // hide x axis grid lines
            svg.selectAll('g.tick > line.grid-line').filter(d => d !== 0.0).remove();

            // Set up any necessary hatching patterns
            svg.append('defs')
                .append('pattern')
                .attr('id', 'rowChartNotAvailableHatch')
                .attr('patternUnits', 'userSpaceOnUse')
                .attr('width', 4)
                .attr('height', 4)
                .attr('patternTransform', 'rotate(45)')
                .append('rect')
                .attr('x', '0')
                .attr('y', '0')
                .attr('width', 2)
                .attr('height', 4)
                .attr('fill', chartNotAvailableColor);

            svg.select('g').selectAll('g.row > rect')
                .attr('fill', 'url(#rowChartNotAvailableHatch)')
                .attr('opacity', '.7')
                .attr('rx', '1')
                .attr('stroke', 'white');

            // add chart not available text
            chart.select('svg > text').remove();
            let bbox = svg.node().getBBox();
            svg
                .append('text')
                .text(chartNotAvailableMessage)
                .style('fill', chartNotAvailableTextColor)
                .attr('class', 'chart-not-available')
                .attr('text-anchor', 'middle')
                .attr('y', bbox.y + (bbox.height / 2) - 6)
                .attr('x', bbox.x + (bbox.width / 2));
        });

        rowChart.render();
    }
});
