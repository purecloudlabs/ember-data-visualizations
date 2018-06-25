import moment from 'moment';
import _ from 'lodash/lodash';
import d3 from 'd3';
import dc from 'dc';
import crossfilter from 'crossfilter';
// import $ from 'jquery';
import BaseChartComponent from '../base-chart-component';

/**
   @public
   @module line-chart
   @type component
   @desc dc.js line chart
*/
export default BaseChartComponent.extend({
    classNames: ['line-chart'],

    buildChart() {
        let compositeChart = dc.compositeChart(`#${this.get('elementId')}`);

        compositeChart
            .renderTitle(false)
            .brushOn(false)
            .height(this.get('height'))
            .margins({
                top: 10,
                right: 100,
                bottom: 50,
                left: 100
            })
            .x(d3.time.scale().domain(this.get('xAxis').domain))
            .xUnits(() => this.get('group')[0].size() * (this.get('group').length + 1))
            .elasticY(true)
            .yAxisPadding('20%')
            .transitionDuration(0);

        if (this.get('width')) {
            compositeChart.width(this.get('width'));
        }

        if (this.get('yAxis') && this.get('yAxis').domain) {
            compositeChart.y(d3.scale.linear().domain(this.get('yAxis').domain));
        }

        if (this.get('currentInterval') && this.get('showCurrentIndicator') && this.get('xAxis') && this.get('xAxis').ticks) {
            compositeChart.xAxis().ticks(this.get('xAxis').ticks).tickValues(this.addTickForCurrentInterval());
        }

        compositeChart.xAxis().outerTickSize(0);
        if (this.get('xAxis') && this.get('xAxis').ticks) {
            compositeChart.xAxis().ticks(this.get('xAxis').ticks);
        }

        compositeChart.yAxis().outerTickSize(0);
        if (this.get('yAxis') && this.get('yAxis').ticks) {
            compositeChart.yAxis().ticks(this.get('yAxis').ticks);
        }

        let lineCharts = [];
        let lineChart;
        let tip = this.createTooltip();

        this.get('group').forEach((g, index) => {
            lineChart = dc.lineChart(compositeChart);

            lineChart
                .group(g)
                .colors(this.get('colors')[index])
                .renderTitle(false)
                .elasticY(true);

            lineCharts.push(lineChart);
        });

        compositeChart
            .on('renderlet', () => this.onRenderlet(tip))
            .compose(lineCharts);

        this.set('chart', compositeChart);
    },

    createTooltip() {
        const formatter = this.get('xAxis.formatter') || (value => value);
        const titles = this.get('series').map(entry => entry.title);
        let tip = d3.tip().attr('class', `d3-tip #${this.get('elementId')}`).html(d => {
            if (!_.isEmpty(titles)) {
                let str = `<span class="tooltip-time">${moment(d.data.key).format(this.get('tooltipDateFormat'))}</span>`;
                titles.forEach((title, i) => {
                    const datum = formatter(this.get('data')[d.data.key][i]);
                    const secondaryClass = d.y === datum ? 'primary-stat' : '';
                    str = str.concat(`<span class="tooltip-list-item"><span class="tooltip-label ${secondaryClass}">${title}</span><span class="tooltip-value ${secondaryClass}">${datum}</span></span>`);
                });
                return str;
            }

            return `<span>${moment(d.data.key).format('L')}</span><br/><span class="tooltip-value">${d.data.value}</span>`;
        });

        return tip;
    },

    onRenderlet(tip) {

        // This is outside the Ember run loop so check if component is destroyed
        if (this.get('isDestroyed') || this.get('isDestroying')) {
            return;
        }

        this.addClickHandlersAndTooltips(d3.select('.line-chart > svg > defs'), tip, 'circle.dot');
        if (this.get('showCurrentIndicator') && this.get('currentInterval')) {
            this.changeTickForCurrentInterval();
        }
    },

    isIntervalIncluded(ticks, interval) {
        return ticks.toString().includes(interval.toString());
    },

    isIntervalInRange(scale, interval) {
        return scale.ticks().pop() >= interval && scale.ticks()[0] <= interval;
    },

    addTickForCurrentInterval() {
        // if indicatorDate is in range but not already in the scale, add it.
        let xTimeScale = d3.time.scale().domain(this.get('xAxis').domain);
        let indicatorDate = this.get('currentInterval') ? this.get('currentInterval.start._d') : null;
        let ticks = xTimeScale.ticks(this.get('xAxis').ticks);
        if (!this.isIntervalIncluded(ticks, indicatorDate) && this.isIntervalInRange(xTimeScale, indicatorDate)) {
            ticks.push(indicatorDate);
        }
        return ticks;
    },

    changeTickForCurrentInterval() {
        // this method should be called on renderlet
        let indicatorDate = this.get('currentInterval.start._d');
        let xTimeScale = d3.time.scale().domain(this.get('xAxis').domain);
        if (this.isIntervalInRange(xTimeScale, indicatorDate)) {
            let currentTick = d3.select('.line-chart > svg > g > g.axis').selectAll('g.tick')
                .filter(d => d.toString() === indicatorDate.toString());
            if (currentTick.select('text').text().indexOf('\u25C6') === -1) {
                let tickHtml = this.isIntervalIncluded(xTimeScale.ticks(this.get('xAxis').ticks), indicatorDate) ? `\u25C6 ${currentTick.text()}` : '\u25C6';
                currentTick.select('text').html(tickHtml);
            }
        }
    },

    showChartNotAvailable() {
        const chartNotAvailableMessage = this.get('chartNotAvailableMessage');
        const chartNotAvailableColor = this.get('chartNotAvailableColor');
        const chartNotAvailableTextColor = this.get('chartNotAvailableTextColor');
        const xAxis = this.get('xAxis');
        const yAxis = this.get('yAxis');

        let compositeChart = dc.compositeChart(`#${this.get('elementId')}`);

        compositeChart
            .colors(chartNotAvailableColor)
            .renderTitle(false)
            .height(this.get('height'))
            .margins({
                top: 10,
                right: 100,
                bottom: 50,
                left: 100
            })
            .x(d3.time.scale().domain(xAxis.domain))
            .xUnits(() => data.length + 1)
            .y(d3.scale.linear().domain([0, 1]));

        if (this.get('width')) {
            compositeChart.width(this.get('width'));
        }

        // determine number of ticks
        const duration = moment.duration(xAxis.domain[1].diff(xAxis.domain[0]));
        let ticks = 30;
        if (duration.asMonths() >= 1) {
            ticks = duration.asDays();
        } else if (duration.asWeeks() >= 1) {
            ticks = 30;
        } else if (duration.asDays() >= 1) {
            ticks = 24;
        }

        // create horizontal line groups
        const data = d3.time.scale().domain(xAxis.domain).ticks(ticks);
        const filter = crossfilter(data);
        const dimension = filter.dimension(d => d);
        let groups = [];
        for (let i = 0; i <= 5; i++) {
            groups[i] = dimension.group().reduce(function () {
                return i / 5;
            },
            function () { },
            function () { });
        }

        // create subcharts
        let lineCharts = [];
        let lineChart;

        groups.forEach((g) => {
            lineChart = dc.lineChart(compositeChart);

            lineChart
                .group(g)
                .dimension(dimension)
                .colors(chartNotAvailableColor)
                .renderTitle(false)
                .x(d3.time.scale().domain(this.get('xAxis').domain));

            lineCharts.push(lineChart);
        });

        compositeChart.compose(lineCharts);

        this.set('chart', compositeChart);

        compositeChart.on('postRender', () => {

            // This is outside the Ember run loop so check if component is destroyed
            if (this.get('isDestroyed') || this.get('isDestroying')) {
                return;
            }

            d3.select('.line-chart > svg > text').remove();
            let svg = d3.select('.line-chart > svg');
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
        if (xAxis && xAxis.ticks) {
            this.get('chart').xAxis().ticks(xAxis.ticks);
        }
        if (yAxis && yAxis.ticks) {
            this.get('chart').yAxis().ticks(yAxis.ticks);
        }
        compositeChart.render();
    }
});