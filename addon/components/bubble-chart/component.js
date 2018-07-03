// import _ from 'lodash/lodash';
import d3 from 'd3';
import dc from 'dc';
import crossfilter from 'crossfilter';
import BaseChartComponent from '../base-chart-component';
// import { bubbleCloud } from 'dc-addons';
// import $ from 'jquery';
import moment from 'moment';
/**
   @public
   @module bubble-chart
   @type component
   @desc dc.js bubble chart
*/
export default BaseChartComponent.extend({
    classNames: ['bubble-chart'],

    showMaxMin: false,
    showComparisonLine: false,
    currentInterval: null,
    showCurrentIndicator: false,
    maxMinSeries: null,

    buildChart() {
        let bubbleChart = dc.bubbleCloud(`#${this.get('elementId')}`);

        let radii = [];
        this.get('group').all().forEach(d => radii.push(this.getRadiusValue(d)));
        let maxRadius = Math.max(...radii);

        const titleFormatter = this.get('titleFormatter') || (value => value);

        bubbleChart
            // required options
            .width(this.get('width'))
            .height(this.get('height'))
            .dimension(this.get('dimension'))
            .group(this.get('group'))
            .x(d3.scale.ordinal())
            .r(d3.scale.linear().domain([0, maxRadius * (this.get('group').size() / 5)]))
            .radiusValueAccessor(d => this.getRadiusValue(d))
            // optional options
            .label(d => titleFormatter(d.key))
            .valueAccessor(d => d.value.color)
            .colors(d3.scale.quantize().domain([0, this.get('colors').length - 1]).range(this.get('colors')))
            .colorAccessor(d => d.value.colorValue)
            .renderTitle(false);

        bubbleChart.on('renderlet', chart => this.onRenderlet(chart, this.createTooltip()));

        this.set('chart', bubbleChart);
    },

    getRadiusValue(d) {
        switch (this.get('radiusFormat')) {
        case 'timestamp':
            return moment.duration(moment().diff(moment(d.value.radius))).asMilliseconds();
        case 'milliseconds':
            return parseInt(d.value.radius);
        case 'count':
            return parseInt(d.value.radius);
        default:
            return parseInt(d.value.radius);
        }
    },

    onRenderlet(chart, tip) {
        // add subtitle
        if (this.get('group').all()[0].value.subtitle) {
            const subtitleFormatter = this.get('subtitleFormatter') || (value => value);
            if (chart.selectAll('.node > text.title').empty()) {
                chart.selectAll('.node > text').attr('class', 'title').attr('dy', null);
                chart.selectAll('.node').append('text')
                    .text(d => subtitleFormatter(d.value.subtitle))
                    .attr('class', 'subtitle')
                    .attr('dy', '1em');
            }
        }

        this.addClickHandlersAndTooltips(chart.select('svg'), tip, 'circle.bubble');
    },

    createTooltip() {
        return d3.tip().attr('class', `d3-tip #${this.get('elementId')}`)
            .style('text-align', 'center')
            .html(d => `<span class="tooltip-value">${d.key}</span><br/><span class="tooltip-label">${d.value.tooltip}</span>`);
    },

    showChartNotAvailable() {
        const chartNotAvailableMessage = this.get('chartNotAvailableMessage');
        const chartNotAvailableColor = this.get('chartNotAvailableColor');
        const chartNotAvailableTextColor = this.get('chartNotAvailableTextColor');

        let bubbleChart = dc.bubbleCloud(`#${this.get('elementId')}`);
        this.set('chart', bubbleChart);

        let data = [];
        for (let i = 1; i <= 10; i++) {
            data.push({ label: i });
        }
        const filter = crossfilter(data);
        const dimension = filter.dimension(d => d.label);
        const group = dimension.group().reduceCount();

        bubbleChart
            .width(this.get('width'))
            .height(this.get('height'))
            .dimension(dimension)
            .group(group)
            .x(d3.scale.ordinal())
            .r(d3.scale.linear().domain([0, 3]))
            .radiusValueAccessor(d => d.value)
            .renderTitle(false)
            .label(() => '')
            .colors(chartNotAvailableColor)
            .transitionDuration(0);

        bubbleChart.on('renderlet', () => {
            // This is outside the Ember run loop so check if component is destroyed
            if (this.get('isDestroyed') || this.get('isDestroying')) {
                return;
            }

            // Set up any necessary hatching patterns
            let svg = d3.select('.bubble-chart > svg');
            svg
                .append('defs')
                .append('pattern')
                .attr('id', 'bubbleChartNotAvailableHatch')
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

            // apply hatching pattern to chart
            svg.append('rect')
                .attr('width', 1000)
                .attr('height', 1000)
                .attr('fill', 'url(#bubbleChartNotAvailableHatch');

            // append text to chart
            svg.selectAll('text').remove();
            let bbox = svg.node().getBBox();
            svg
                .append('text')
                .text(chartNotAvailableMessage)
                .style('fill', chartNotAvailableTextColor)
                .attr('class', 'chart-not-available')
                .attr('text-anchor', 'middle')
                .attr('y', bbox.y + (bbox.height / 2))
                .attr('x', bbox.x + (bbox.width / 2));
        });
        bubbleChart.render();
    }
});