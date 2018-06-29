import d3 from 'd3';
import dc from 'dc';
import crossfilter from 'crossfilter';
import $ from 'jquery';
import BaseChartComponent from '../base-chart-component';

/**
   @public
   @module pie-chart
   @type component
   @desc dc.js pie chart
*/
export default BaseChartComponent.extend({
    classNames: ['pie-chart'],

    externalLabels: false,
    labels: true,

    buildChart() {
        let chart = dc.pieChart(`#${this.get('elementId')}`);

        chart
            .radius(this.get('height') / 2)
            .ordinalColors(this.get('colors'))
            .dimension(this.get('dimension'))
            .group(this.get('group'))
            .renderTitle(false)
            .legend(dc.legend()
                .gap(15)
                .y(10)
                .x(30));

        if (this.get('colorMap')) {
            chart.colors(d3.scale.ordinal().domain(this.get('colorMap')).range(this.get('colors')));
        }

        if (this.get('externalLabels')) {
            chart
                .externalRadiusPadding(this.get('height') * 0.1)
                .externalLabels(this.get('height') * 0.08);
        }

        if (this.get('donutChart')) {
            chart.innerRadius(this.get('height') / 4);
        }

        if (!this.get('labels')) {
            chart.on('pretransition', (chart) => {
                chart.selectAll('text.pie-slice').remove();
            });
        }

        let tip = this.createTooltip();
        chart.on('renderlet', chart => this.onRenderlet(chart, tip));

        this.set('chart', chart);
    },

    onRenderlet(chart, tip) {
        chart.select('g.pie-slice-group > .totalText').remove();
        if (this.get('showTotal')) {
            chart.select('g.pie-slice-group')
                .append('text')
                .attr('class', 'totalText')
                .attr({ 'text-anchor': 'middle' })
                .text(this.get('data').total);
        }
        this.addClickHandlersAndTooltips(chart.select('svg'), tip);
    },

    createTooltip() {
        return d3.tip()
            .attr('class', 'd3-tip pie-chart')
            .attr('id', `${this.get('elementId')}`)
            .style('text-align', 'center')
            .html(d => {
                return `<span class="pie-tip-key">${d.data.key}</span><br/><span class="pie-tip-value">${d.data.value}</span>`;
            });
    },

    addClickHandlersAndTooltips(svg, tip) {
        if (tip && !svg.empty()) {
            svg.call(tip);
        }

        // clicking actions
        this.get('chart').selectAll('.pie-slice').on('click', d => {
            this.onClick(d);
        });

        // tooltip positioning
        this.get('chart').selectAll('.pie-slice')
            .on('mouseover.tip', d => {
                tip
                    .show(d);

                const endAngle = d.endAngle - (Math.PI / 2), startAngle = d.startAngle - (Math.PI / 2);
                const alpha = endAngle - startAngle;
                const radius = this.get('chart').radius();

                // coordinates of centroid if startAngle = 0
                const xbar = (2 / 3) * (radius / alpha) * Math.sin(alpha);
                const ybar = (-2 / 3) * (radius / alpha) * (Math.cos(alpha) - 1);

                // rotate about (0,0) (center of circle) startAngle radians
                const centroidY = ybar * Math.cos(startAngle) + xbar * Math.sin(startAngle);
                const centroidX = xbar * Math.cos(startAngle) - ybar * Math.sin(startAngle);

                // coordinates of the center point of the chart
                const centerOfChartY = $(`#${this.get('elementId')}`)[0].offsetTop + (this.get('chart').height() / 2);
                const centerOfChartX = $(`#${this.get('elementId')}`)[0].offsetLeft + (this.get('chart').width() / 2);

                // account for size of tooltip
                const offsetX = ((d.data.key.length + 1) * -4);
                const offsetY = 0;

                tip.style('top', (`${centerOfChartY + centroidY + offsetY}px`));
                tip.style('left', (`${centerOfChartX + centroidX + offsetX}px`));
            })
            .on('mouseout.tip', tip.hide);
    },

    onClick(d) {
        const allSlices = this.get('chart').selectAll('.pie-slice');
        const thisSlice = allSlices.filter(pieD => pieD == d);
        const siblings = allSlices.filter(pieD => pieD !== d);
        const legendItems = this.get('chart').selectAll('.dc-legend-item');
        const thisLegendItem = legendItems.filter(legendD => legendD.data == d.value);
        const siblingLegendItems = legendItems.filter(legendD => legendD.data !== d.value);

        if (thisSlice.style('opacity') == 1) {
            // either there is no selection or this slice is selected
            if (siblings.style('opacity') == 1) {
                // no selection yet: select this element
                thisLegendItem.style('opacity', 1);
                thisSlice.style('opacity', 1);
                siblingLegendItems.style('opacity', .5);
                siblings.style('opacity', .5);
            } else {
                // this is selected: unselect all
                allSlices.style('opacity', 1);
                legendItems.style('opacity', 1);
            }
        } else {
            // another slice is selected: select this one instead
            thisSlice.style('opacity', 1);
            thisLegendItem.style('opacity', 1);
            siblings.style('opacity', .5);
            siblingLegendItems.style('opacity', .5);
        }
    },

    showChartNotAvailable() {
        const chartNotAvailableMessage = this.get('chartNotAvailableMessage');
        const chartNotAvailableColor = this.get('chartNotAvailableColor');
        const chartNotAvailableTextColor = this.get('chartNotAvailableTextColor');

        let pieChart = dc.pieChart(`#${this.get('elementId')}`);
        this.set('chart', pieChart);

        const data = [{ key: '', value: 1 }];
        const filter = crossfilter(data);
        const dimension = filter.dimension(d => d);
        const group = dimension.group().reduceCount(g => g);

        pieChart
            .group(group)
            .dimension(dimension)
            .colors(chartNotAvailableColor)
            .renderTitle(false)
            .renderLabel(false);

        if (this.get('donutChart')) {
            pieChart.innerRadius(this.get('height') / 3);
        }

        pieChart.on('renderlet', () => {
            // This is outside the Ember run loop so check if component is destroyed
            if (this.get('isDestroyed') || this.get('isDestroying')) {
                return;
            }

            // Set up any necessary hatching patterns
            let svg = d3.select('.pie-chart > svg');
            svg
                .append('defs')
                .append('pattern')
                .attr('id', 'pieChartNotAvailableHatch')
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
            svg.select('g > g > g > path').attr('fill', 'url(#pieChartNotAvailableHatch');

            // append text to chart
            svg.select('text').remove();
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
        pieChart.render();
    }
});