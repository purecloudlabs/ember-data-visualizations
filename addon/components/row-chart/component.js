// import moment from 'moment';
import _ from 'lodash/lodash';
import d3 from 'd3';
import dc from 'dc';
// import crossfilter from 'crossfilter';
// import $ from 'jquery';
import BaseChartComponent from '../base-chart-component';
/**
   @public
   @module row-chart
   @type component
   @desc dc.js row chart
*/
export default BaseChartComponent.extend({
    classNames: ['row-chart'],

    colors: [
        '#1f77b4', '#ff7f0e', '#2ca02c',
        '#9467bd', '#8c564b', '#e377c2',
        '#7f7f7f', '#bcbd22', '#17becf'
    ],

    showMaxMin: false,
    showComparisonLine: false,
    currentInterval: null,
    showCurrentIndicator: false,
    maxMinSeries: null,

    // Horizontal line to mark a target, average, or any kind of comparison value
    // Ex. { value: 0.8, displayValue: '80%', color: '#2CD02C' }
    comparisonLine: null,

    buildChart() {
        let rowChart = dc.rowChart(`#${this.get('elementId')}`);

        rowChart
            .group(this.get('group')[0])
            .dimension(this.get('dimension'))
            .ordering((d) => d.key)
            .colors(this.get('colors')[2])
            .height(this.get('height'))
            .width(this.get('width'))
            .renderLabel(false)
            .renderTitle(false)
            .xAxis().ticks(this.get('xAxis.ticks'));
        // .xAxisPadding('20%');

        rowChart.on('pretransition', () => {
            let totalWidth = this.get('width') + this.get('labelWidth');
            d3.select('.row-chart > svg').attr('width', totalWidth);
            d3.select('.row-chart > svg > g').attr('transform', `translate(${this.get('labelWidth')},0)`).attr('width', totalWidth);
            if (this.get('hideAxisLines')) {
                d3.selectAll('.row-chart > svg > g > g.axis > g.tick > line').remove();
            }
        });

        let tip = this.createTooltip();

        rowChart.on('renderlet', () => this.onRenderlet(tip));
        this.set('chart', rowChart);
    },

    createTooltip() {
        return d3.tip().attr('class', `d3-tip #${this.get('elementId')}`)
            .style('text-align', 'center')
            .html(d => `<span class="row-tip-key">${d.key}</span><br/><span class="row-tip-value">${d.value}</span>`)
            .direction('e');
    },

    onRenderlet(tip) {
        this.addYAxis();
        if (this.get('showMaxMin')) {
            this.addMaxMinLabels(this.get('chart').selectAll('g.row > rect')[0]);
        }
        this.addClickHandlersAndTooltips(d3.select('.row-chart > svg'), tip, 'g.row > rect');
    },

    addYAxis() {
        // add labels to corresponding bar groups and move them appropriately
        let barHeight = d3.select('.row-chart > svg g.row > rect').attr('height');
        d3.selectAll('.row-chart > svg > g > g.row')
            .append('g').attr('class', 'tick')
            .append('text')
            .text(d => d.key)
            .attr('y', barHeight / 2)
            .attr('dy', '.35em')
            .attr('x', function () {
                return -1 * d3.select(this)[0][0].clientWidth - 15;
            });

        // hide x axis grid lines
        if (this.get('hideAxisLines')) {
            let lineFunction = d3.svg.line()
                .y(d => d.y)
                .x(() => 0)
                .interpolate('linear');
            // add 0 line
            d3.select('.row-chart > svg > g > g.axis').append('path')
                .attr('class', 'range')
                .attr('d', lineFunction([{ 'y': 0 }, { 'y': -1 * this.get('height') }]));
        }

        // add y ticks and grid lines
        let ticksGroups = d3.selectAll('.row-chart > svg > g > g.row > g.tick');
        let lineFunction = d3.svg.line()
            .y(() => 0)
            .x(d => d.x)
            .interpolate('linear');
        if (this.get('showYTicks')) {
            ticksGroups.append('path')
                .attr('d', lineFunction([{ 'x': 0 }, { 'x': 6 }]))
                .attr('transform', `translate(-6,${barHeight / 2})`);
        }

        if (this.get('showYTickLines')) {
            let widths = [];
            d3.selectAll('.row-chart > svg > g > g.row > rect').each(function () {
                widths.push(d3.select(this).attr('width'));
            });
            let width = this.get('width') - 80;
            ticksGroups.each(function (d, i) {
                d3.select(this).append('path')
                    .attr('d', lineFunction([{ 'x': parseInt(widths[i]) + 1 }, { 'x': width }]))
                    .attr('transform', `translate(-0,${barHeight / 2})`);
            });
        }
    },

    addMaxMinLabels(bars) {
        let formatter = this.get('xAxis.formatter') || (value => value);
        let maxValue, maxIdx, minValue, minIdx, values, nonZeroValues;
        let groups = this.get('group');
        groups.forEach((g, index) => {
            if (this.get('showMaxMin') && _.isNumber(this.get('seriesMaxMin'))) {
                if (index === this.get('seriesMaxMin')) {
                    values = g.all().map(gElem => gElem.value);
                    nonZeroValues = values.filter(v => v > 0);
                    maxValue = _.max(nonZeroValues);
                    maxIdx = values.indexOf(maxValue);
                    maxValue = formatter(maxValue);
                    minValue = _.min(nonZeroValues);
                    minIdx = values.indexOf(minValue);
                    minValue = formatter(minValue);
                }
            }
        });
        let gLabels = d3.select('.row-chart > svg > g').append('g').attr('id', 'inline-labels');
        let b = bars[maxIdx];

        // Choose the tallest bar in the stack (lowest y value) and place the max/min labels above that.
        // Avoids label falling under any bar in the stack.
        const maxLabelY = Math.max(...bars.map(rect => parseInt(rect.getAttribute('width'), 10)));

        if (b) {
            gLabels.append('text')
                .text(maxValue)
                .attr('transform', b.parentNode.getAttribute('transform'))
                // .attr('x', Math.max(12, maxLabelY - 2))
                .attr('text-anchor', 'middle')
                .attr('font-size', '12px')
                .attr('fill', this.get('colors')[this.get('seriesMaxMin')])
                .attr('class', 'max-value-text');

            if (!(maxIdx === minIdx)) {
                gLabels.append('text')
                    // unicode for font-awesome caret up
                    .html(() => '&#xf0d8')
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
                .attr('y', +b.getAttribute('y') + (b.getAttribute('height') / 2))
                .attr('x', Math.max(12, maxLabelY - 2))
                .attr('text-anchor', 'middle')
                .attr('font-size', '12px')
                .attr('fill', this.get('colors')[this.get('seriesMaxMin')])
                .attr('class', 'min-value-text');

            gLabels.append('text')
                // unicode for font-awesome caret down
                .html(() => '&#xf0d7')
                .attr('class', 'caret-icon min-value-indicator')
                .attr('text-anchor', 'middle')
                .attr('y', +b.getAttribute('y') + (b.getAttribute('height') / 2))
                .attr('x', maxLabelY - 12);
        }
    }
});