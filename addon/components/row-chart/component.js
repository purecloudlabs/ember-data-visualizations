import _ from 'lodash/lodash';
import d3 from 'd3';
import dc from 'dc';
import crossfilter from 'crossfilter';
import BaseChartComponent from '../base-chart-component';
import $ from 'jquery';
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

    // Horizontal line to mark a target, average, or any kind of comparison value
    // Ex. { value: 0.8, displayValue: '80%', color: '#2CD02C' }
    // this is not currently implemented in this row chart but is here for potential future use
    comparisonLine: null,

    buildChart() {
        let rowChart = dc.rowChart(`#${this.get('elementId')}`);
        let width = this.get('width') || 600;
        let height = this.get('height') || 400;
        let labelWidth = this.get('labelWidth') || 150;

        rowChart
            .transitionDuration(0)
            .elasticX(true)
            .group(this.get('group')[0])
            .dimension(this.get('dimension'))
            .ordering((d) => d.key)
            .colors(this.get('colors')[2])
            .height(height)
            .width(width)
            .renderLabel(false)
            .renderTitle(false)
            .xAxis().ticks(this.get('xAxis.ticks'));

        rowChart.on('pretransition', (chart) => {
            // move svg over to make room for labels
            let totalWidth = width + labelWidth;
            chart.select('svg').attr('width', totalWidth);
            chart.select('svg > g').attr('transform', `translate(${labelWidth},0)`).attr('width', totalWidth);

            // hide x axis grid lines
            if (this.get('hideAxisLines')) {
                chart.select('svg').selectAll('g.tick > line.grid-line').filter(d => d !== 0.0).remove();
            }
        });

        let tip = this.createTooltip();

        rowChart.on('renderlet', (chart) => this.onRenderlet(chart, tip));
        this.set('chart', rowChart);
    },

    createTooltip() {
        return d3.tip().attr('class', `d3-tip #${this.get('elementId')}`)
            .style('text-align', 'center')
            .html(d => `<span class="row-tip-key">${d.key}</span><br/><span class="row-tip-value">${d.value}</span>`)
            .direction('e');
    },

    onRenderlet(chart, tip) {
        this.addYAxis(chart);
        $(`#${this.get('elementId')} #inline-labels`).remove();
        if (this.get('showMaxMin')) {
            this.addMaxMinLabels(chart.selectAll('g.row > rect')[0]);
        }
        this.addClickHandlersAndTooltips(chart.select('svg'), tip, 'g.row > rect');
    },

    addYAxis(chart) {
        // add labels to corresponding bar groups and move them appropriately
        let barHeight = chart.select('svg g.row > rect').attr('height');
        if (chart.selectAll('svg > g > g.row > g.tick').empty()) {
            chart.selectAll('svg > g > g.row')
                .append('g').attr('class', 'tick')
                .append('text')
                .text(d => d.key)
                .attr('y', barHeight / 2)
                .attr('dy', '.35em')
                .attr('x', function () {
                    return -1 * d3.select(this)[0][0].clientWidth - 15;
                });
        }

        // add y ticks and grid lines
        let ticksGroups = chart.selectAll('svg > g > g.row > g.tick');
        let lineFunction = d3.svg.line()
            .y(() => 0)
            .x(d => d.x)
            .interpolate('linear');
        if (this.get('showYTicks')) {
            ticksGroups.append('path')
                .attr('d', lineFunction([{ 'x': 0 }, { 'x': 6 }]))
                .attr('class', 'yTick')
                .attr('transform', `translate(-6,${barHeight / 2})`);
        }

        // this is a bit hack-y; it only draws the line from the end of the bar to the end of the svg.
        // the lines must be added after the bars, though, to know where to position them, and making them the full length
        // causes them to show on top of the bars.
        // d3 v4 has a sendToBack function which would solve this problem.
        if (this.get('showYTickLines')) {
            let widths = [];
            chart.selectAll('svg > g > g.row > rect').each(function () {
                widths.push(d3.select(this).attr('width'));
            });
            let thisWidth = this.get('width') || 600;
            let width = thisWidth - 80;
            ticksGroups.each(function (d, i) {
                d3.select(this).append('path')
                    .attr('d', lineFunction([{ 'x': parseInt(widths[i]) + 1 }, { 'x': width }]))
                    .attr('class', 'yTickLine')
                    .attr('transform', `translate(-0,${barHeight / 2})`);
            });
        }
    },

    addMaxMinLabels(bars) {
        let formatter = this.get('xAxis.formatter') || (value => value);
        let maxValue, maxIdx, minValue, minIdx, values, nonZeroValues;
        let g = this.get('group')[0];
        values = g.all().map(gElem => gElem.value);
        nonZeroValues = values.filter(v => v > 0);
        maxValue = _.max(nonZeroValues);
        maxIdx = values.indexOf(maxValue);
        maxValue = formatter(maxValue);
        minValue = _.min(nonZeroValues);
        minIdx = values.indexOf(minValue);
        minValue = formatter(minValue);
        let gLabels = this.get('chart').select('svg > g').append('g').attr('id', 'inline-labels');
        let b = bars[maxIdx];

        // Choose the tallest bar in the stack (lowest y value) and place the max/min labels above that.
        // Avoids label falling under any bar in the stack.
        const maxLabelY = Math.max(...bars.map(rect => parseInt(rect.getAttribute('width'), 10))) + 25;

        if (b) {
            gLabels.append('text')
                .text(maxValue)
                .attr('transform', b.parentNode.getAttribute('transform'))
                .attr('x', Math.max(12, maxLabelY - 2) + 5)
                .attr('y', +b.getAttribute('y') + (b.getAttribute('height') / 2))
                .attr('text-anchor', 'middle')
                .attr('font-size', '12px')
                .attr('fill', this.get('colors')[this.get('seriesMaxMin')])
                .attr('class', 'max-value-text');

            if (!(maxIdx === minIdx)) {
                gLabels.append('text')
                    // unicode for font-awesome caret right
                    .attr('transform', b.parentNode.getAttribute('transform'))
                    .html(() => '&#xf0da')
                    .attr('text-anchor', 'middle')
                    .attr('class', 'caret-icon max-value-indicator')
                    .attr('y', +b.getAttribute('y') + (b.getAttribute('height') / 2))
                    .attr('x', maxLabelY - 12);
            }
        }
        b = bars[minIdx];

        if (b && !(maxIdx === minIdx)) {
            gLabels.append('text')
                .text(minValue)
                .attr('transform', b.parentNode.getAttribute('transform'))
                .attr('x', Math.max(12, maxLabelY - 2) + 5)
                .attr('y', +b.getAttribute('y') + (b.getAttribute('height') / 2))
                .attr('text-anchor', 'middle')
                .attr('font-size', '12px')
                .attr('fill', this.get('colors')[this.get('seriesMaxMin')])
                .attr('class', 'min-value-text');

            gLabels.append('text')
                // unicode for font-awesome caret left
                .html(() => '&#xf0d9')
                .attr('transform', b.parentNode.getAttribute('transform'))
                .attr('class', 'caret-icon min-value-indicator')
                .attr('text-anchor', 'middle')
                .attr('y', +b.getAttribute('y') + (b.getAttribute('height') / 2))
                .attr('x', maxLabelY - 12);
        }
    },
    showChartNotAvailable() {
        const chartNotAvailableMessage = this.get('chartNotAvailableMessage');
        const chartNotAvailableColor = this.get('chartNotAvailableColor');
        const chartNotAvailableTextColor = this.get('chartNotAvailableTextColor');
        const width = this.get('width') || 600;
        const height = this.get('height') || 400;
        const labelWidth = this.get('labelWidth') || 150;

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
            .height(height)
            .width(width)
            .renderLabel(false)
            .group(group)
            .dimension(dimension)
            .xAxis().ticks(this.get('xAxis.ticks'));

        rowChart.on('pretransition', (chart) => {
            // move it the same distance over as it would be if it did have labels (for consistency)
            let totalWidth = width + labelWidth;
            chart.select('svg').attr('width', totalWidth);
            chart.select('svg > g').attr('transform', `translate(${labelWidth},0)`).attr('width', totalWidth);
        });

        rowChart.on('renderlet', (chart) => {
            // This is outside the Ember run loop so check if component is destroyed
            if (this.get('isDestroyed') || this.get('isDestroying')) {
                return;
            }

            let svg = chart.select('svg');
            // let svgDefs = svg.append('defs');

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
                .attr('rx', '2')
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