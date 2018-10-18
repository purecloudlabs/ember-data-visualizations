import d3 from 'd3';
import crossfilter from 'crossfilter';
import BaseChartComponent from '../base-chart-component';
import moment from 'moment';
import d3Tip from 'd3-tip';
import bubbleCloud from 'dc-addons-bubble-chart';

/**
   @public
   @module bubble-chart
   @type component
   @desc dc.js bubble chart
*/
export default BaseChartComponent.extend({
    classNames: ['bubble-chart'],

    buildChart() {
        let bubbleChart = bubbleCloud(`#${this.get('elementId')}`);

        let radii = [];
        this.get('group').all().forEach(d => radii.push(this.getRadiusValue(d)));
        let maxRadius = Math.max(...radii);
        const legendWidth = this.get('legendWidth') || 250;
        const rightMargin = this.get('showLegend') ? legendWidth : 5;

        const titleFormatter = this.get('titleFormatter') || (value => value);

        bubbleChart
            .height(this.get('height'))
            .dimension(this.get('dimension'))
            .group(this.get('group'))
            .x(d3.scaleOrdinal().range([0, maxRadius * this.get('group').size()]))
            .r(d3.scaleLinear().domain([0, maxRadius * this.get('group').size() / 3]))
            .radiusValueAccessor(d => this.getRadiusValue(d))
            .label(d => titleFormatter(d.key))
            .colors(d3.scaleQuantize().domain([0, this.get('colors').length - 1]).range(this.get('colors')))
            .colorAccessor(d => d.value.colorValue)
            .renderTitle(false)
            .margins({
                top: 10,
                right: rightMargin,
                bottom: 50,
                left: 50
            });

        if (this.get('width')) {
            bubbleChart.width(this.get('width'));
        }

        bubbleChart.on('renderlet', chart => this.onRenderlet(chart, this.createTooltip()));

        this.set('chart', bubbleChart);
    },

    getRadiusValue(d) {
        if (this.get('radiusFormat') === 'timestamp') {
            return moment.duration(moment().diff(moment(d.value.radius))).asMilliseconds();
        }
        return parseInt(d.value.radius);
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

        if (this.get('showLegend')) {
            chart.select('g.legend').remove();
            const legendDimension = 18;
            let legendG = chart.select('g')
                .append('g')
                .attr('transform', `translate(${chart.width() - chart.margins().right + 10},${chart.effectiveHeight() / 4})`);
            this.addLegend(chart, this.getLegendables(chart), legendG, legendDimension);
        }

        this.addClickHandlersAndTooltips(chart.select('svg'), tip, 'circle.bubble');
    },

    getLegendables(chart) {
        let legendables = [];
        let alreadyDone = [];
        for (let i = 0; i < chart.data().length; i++) {
            if (alreadyDone.indexOf(chart.data()[i].value.tooltip) === -1) {
                let legendable = {};
                legendable.title = chart.data()[i].value.tooltip;
                legendable.color = chart.getColor(chart.data()[i]);
                legendable.elements = chart.selectAll('circle.bubble').filter(d => d.value.tooltip === legendable.title);
                legendables.push(legendable);
                alreadyDone.push(chart.data()[i].value.tooltip);
            }
        }
        return legendables;
    },

    createTooltip() {
        return d3Tip().attr('class', 'd3-tip')
            .attr('id', this.get('elementId'))
            .style('text-align', 'center')
            .html(d => `<span class="tooltip-value">${d.key}</span><br/><span class="tooltip-label">${d.value.tooltip}</span>`);
    },

    showChartNotAvailable() {
        const chartNotAvailableMessage = this.get('chartNotAvailableMessage');
        const chartNotAvailableColor = this.get('chartNotAvailableColor');
        const chartNotAvailableTextColor = this.get('chartNotAvailableTextColor');

        let bubbleChart = bubbleCloud(`#${this.get('elementId')}`);
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
            .x(d3.scaleOrdinal())
            .r(d3.scaleLinear().domain([0, 3]))
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
                .attr('width', svg.attr('width'))
                .attr('height', svg.attr('height'))
                .attr('fill', 'url(#bubbleChartNotAvailableHatch');

            // append text to chart
            svg.selectAll('text').remove();
            let bbox = svg.node().getBBox();
            const textLength = chartNotAvailableMessage.length;
            svg
                .append('rect')
                .attr('y', bbox.y + (bbox.height / 2) + 25)
                .attr('x', bbox.x + (bbox.width / 2) - textLength * 4)
                .attr('stroke', chartNotAvailableColor)
                .attr('height', '50px')
                .attr('width', textLength * 8)
                .attr('fill', '#fff');
            svg
                .append('rect')
                .attr('y', bbox.y + (bbox.height / 2) + 25)
                .attr('x', bbox.x + (bbox.width / 2) - textLength * 4)
                .attr('stroke', chartNotAvailableColor)
                .attr('height', '50px')
                .attr('width', textLength * 8)
                .attr('fill', 'url(#bubbleChartNotAvailableHatch');
            svg.append('text')
                .text(chartNotAvailableMessage)
                .style('fill', chartNotAvailableTextColor)
                .attr('class', 'chart-not-available')
                .attr('text-anchor', 'middle')
                .attr('y', bbox.y + (bbox.height / 2) + 55)
                .attr('x', bbox.x + (bbox.width / 2));
        });
        bubbleChart.render();
    }
});
