import moment from 'moment';
import d3 from 'd3';
import dc from 'dc';
import crossfilter from 'crossfilter';
import $ from 'jquery';
import BaseChartComponent from '../base-chart-component';
import { isEmpty } from '@ember/utils';

/**
   @public
   @module line-chart
   @type component
   @desc dc.js line chart
*/
export default BaseChartComponent.extend({
    classNames: ['line-chart'],

    showMaxMin: false,
    showComparisonLine: false,
    currentInterval: null,
    showCurrentIndicator: false,
    maxMinSeries: null,

    // Horizontal line to mark a target, average, or any kind of comparison value
    // Ex. { value: 0.8, displayValue: '80%', color: '#2CD02C' }
    comparisonLine: null,

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
            .x(d3.scaleTime().domain(this.get('xAxis').domain))
            .xUnits(() => this.get('group')[0].size() * (this.get('group').length + 1))
            .elasticY(true)
            .yAxisPadding('20%')
            .transitionDuration(0);

        if (this.get('width')) {
            compositeChart.width(this.get('width'));
        }

        if (this.get('yAxis') && this.get('yAxis').domain) {
            compositeChart.y(d3.scaleLinear().domain(this.get('yAxis').domain));
        }

        if (this.get('currentInterval') && this.get('showCurrentIndicator') && this.get('xAxis') && this.get('xAxis').ticks) {
            compositeChart.xAxis().ticks(this.get('xAxis').ticks).tickValues(this.addTickForCurrentInterval());
        }

        compositeChart.xAxis().tickSizeOuter(0);
        if (this.get('xAxis') && this.get('xAxis').ticks) {
            compositeChart.xAxis().ticks(this.get('xAxis').ticks);
        }

        compositeChart.yAxis().tickSizeOuter(0);
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
        let tip = d3.tip().attr('class', 'd3-tip')
            .attr('id', this.get('elementId'))
            .html(d => {
                if (!isEmpty(titles)) {
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

        let dots = this.get('chart').selectAll('.sub._0 circle.dot')._groups[0];

        $(`#${this.get('elementId')} #inline-labels`).remove();

        // Show min and max values over lines
        if (this.get('showMaxMin') && this.get('seriesMaxMin') && dots.length > 0) {
            this.addMaxMinLabels(dots);
        }

        if (this.get('showComparisonLine') && this.get('comparisonLine') && !isEmpty(this.get('data'))) {
            this.addComparisonLine();
        }
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
        let xTimeScale = d3.scaleTime().domain(this.get('xAxis').domain);
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
        let xTimeScale = d3.scaleTime().domain(this.get('xAxis').domain);
        if (this.isIntervalInRange(xTimeScale, indicatorDate)) {
            let currentTick = d3.select('.line-chart > svg > g > g.axis').selectAll('g.tick')
                .filter(d => d.toString() === indicatorDate.toString());
            if (currentTick.select('text').text().indexOf('\u25C6') === -1) {
                let tickHtml = this.isIntervalIncluded(xTimeScale.ticks(this.get('xAxis').ticks), indicatorDate) ? `\u25C6 ${currentTick.text()}` : '\u25C6';
                currentTick.select('text').html(tickHtml);
            }
        }
    },

    addComparisonLine() {
        const chartBody = d3.select('.line-chart > svg > g');
        const line = this.get('comparisonLine');

        this.get('chart').selectAll('.comparison-line').remove();
        this.get('chart').selectAll('#comparison-text').remove();

        chartBody.append('svg:line')
            .attr('x1', 100)
            .attr('x2', this.get('chart').width() - 95)
            .attr('y1', 10 + this.get('chart').y()(line.value))
            .attr('y2', 10 + this.get('chart').y()(line.value))
            .attr('class', 'comparison-line')
            .style('stroke', line.color || '#2CD02C');

        chartBody.append('svg:line')
            .attr('x1', 100)
            .attr('x2', 100)
            .attr('y1', 15 + this.get('chart').y()(line.value))
            .attr('y2', 5 + this.get('chart').y()(line.value))
            .attr('class', 'comparison-line')
            .style('stroke', line.color || '#2CD02C');

        chartBody.append('svg:line')
            .attr('x1', this.get('chart').width() - 95)
            .attr('x2', this.get('chart').width() - 95)
            .attr('y1', 15 + this.get('chart').y()(line.value))
            .attr('y2', 5 + this.get('chart').y()(line.value))
            .attr('class', 'comparison-line')
            .style('stroke', line.color || '#2CD02C');

        chartBody.append('text')
            .text(line.displayValue)
            .attr('x', 80)
            .attr('y', 14 + this.get('chart').y()(line.value))
            .attr('text-anchor', 'middle')
            .attr('font-size', '12px')
            .attr('id', 'comparison-text')
            .attr('fill', line.textColor || '#000000');
    },

    addMaxMinLabels(dots) {
        let formatter = this.get('xAxis.formatter') || (value => value);
        let maxValue, maxIdx, minValue, minIdx, values, nonZeroValues;
        let groups = this.get('group');
        groups.forEach((g, index) => {
            if (this.get('showMaxMin') && this.get('seriesMaxMin')) {
                if (index === this.get('seriesMaxMin')) {
                    values = g.all().map(gElem => gElem.value);
                    nonZeroValues = values.filter(v => v > 0);
                    maxValue = Math.max(...nonZeroValues);
                    maxIdx = values.indexOf(maxValue);
                    maxValue = formatter(maxValue);
                    minValue = Math.min(...nonZeroValues);
                    minIdx = values.indexOf(minValue);
                    minValue = formatter(minValue);
                }
            }
        });
        let gLabels = d3.select(dots[0].parentNode).append('g').attr('id', 'inline-labels');
        let d = dots[maxIdx];

        // Choose the tallest circle in the stack (lowest y value) and place the max/min labels above that.
        // Avoids label falling under any line in the stack.
        let yValues = [];
        this.get('chart').selectAll('circle.dot').each(function () {
            yValues.push(parseInt(d3.select(this).attr('cy')));
        });
        const maxLabelY = Math.min(...yValues);

        if (d) {
            gLabels.append('text')
                .text(maxValue)
                .attr('x', +d.getAttribute('cx') + (d.getAttribute('r') / 2))
                .attr('y', Math.max(12, maxLabelY - 2))
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
                    .attr('x', +d.getAttribute('cx') + (d.getAttribute('r') / 2))
                    .attr('y', maxLabelY - 12);
            }
        }
        d = dots[minIdx];

        if (d && !(maxIdx === minIdx)) {
            gLabels.append('text')
                .text(minValue)
                .attr('x', +d.getAttribute('cx') + (d.getAttribute('r') / 2))
                .attr('y', Math.max(12, maxLabelY - 2))
                .attr('text-anchor', 'middle')
                .attr('font-size', '12px')
                .attr('fill', this.get('colors')[this.get('seriesMaxMin')])
                .attr('class', 'min-value-text');

            gLabels.append('text')
                // unicode for font-awesome caret down
                .html(() => '&#xf0d7')
                .attr('class', 'caret-icon min-value-indicator')
                .attr('text-anchor', 'middle')
                .attr('x', +d.getAttribute('cx') + (d.getAttribute('r') / 2))
                .attr('y', maxLabelY - 12);
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
            .x(d3.scaleTime().domain(xAxis.domain))
            .xUnits(() => data.length + 1)
            .y(d3.scaleLinear().domain([0, 1]));

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
        const data = d3.scaleTime().domain(xAxis.domain).ticks(ticks);
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
                .x(d3.scaleTime().domain(this.get('xAxis').domain));

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
