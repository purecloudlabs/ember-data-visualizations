import moment from 'moment';
import dc from 'dc';
import crossfilter from 'crossfilter';
import BaseChartComponent from '../base-chart-component';
import { isEmpty } from '@ember/utils';
import d3Tip from 'd3-tip';
import d3 from 'd3';
import ChartSizes from 'ember-data-visualizations/utils/chart-sizes';
import { getTickFormat } from 'ember-data-visualizations/utils/d3-localization';
import { addComparisonLines, addComparisonLineTicks } from 'ember-data-visualizations/utils/comparison-lines';
import { addDomainTicks } from 'ember-data-visualizations/utils/domain-tweaks';
import { computed } from '@ember/object';

import layout from './template';

/**
   @public
   @module line-chart
   @type component
   @desc dc.js line chart
*/
export default BaseChartComponent.extend({
    layout,
    classNames: ['line-chart'],

    elementToApplyTipSelector: 'circle.dot',
    showMaxMin: false,
    showComparisonLines: false,
    currentInterval: null,
    showCurrentIndicator: false,
    maxMinSeries: null,

    chartId: computed('elementId', function () {
        const elementId = this.get('elementId');
        return `line-chart-${elementId}`;
    }),

    init() {
        this._super(...arguments);
        if (!this.get('d3LocaleInfo')) {
            this.set('d3LocaleInfo', {});
        }
    },

    buildChart() {
        const chartId = `#${this.get('chartId')}`;
        let compositeChart = dc.compositeChart(chartId, this.get('uniqueChartGroupName'));

        const height = this.get('height');
        const showLegend = this.get('legendOptions.showLegend');
        const shouldAppendLegendBelow = this.get('legendOptions.shouldAppendLegendBelow');

        // if the legend renders on the right, give the right margin enough room to render the legend
        const legendWidth = this.get('legendWidth') || ChartSizes.LEGEND_WIDTH;
        const legendInsetX = legendWidth + ChartSizes.LEGEND_OFFSET_X;

        const rightMargin = showLegend && !shouldAppendLegendBelow ? legendInsetX : ChartSizes.RIGHT_MARGIN;

        // if the legend renders below the chart, we want the chart as close to the bottom as possible
        const bottomMargin = showLegend && !shouldAppendLegendBelow ? ChartSizes.BOTTOM_MARGIN : 20;

        // let d3 handle scaling if not otherwise specified
        const useElasticY = !this.get('yAxis.domain');

        compositeChart
            .renderTitle(false)
            .brushOn(false)
            .height(height)
            .margins({
                top: 10,
                right: rightMargin,
                bottom: bottomMargin,
                left: 100
            })
            .x(d3.scaleTime().domain(this.get('xAxis').domain))
            .xUnits(() => {
                if (this.get('group.length')) {
                    return this.get('group')[0].size() * (this.get('group.length') + 1);
                }
                return 0;
            })
            .elasticY(useElasticY)
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
        compositeChart.xAxis().tickFormat(getTickFormat(this.get('d3LocaleInfo')));
        if (this.get('xAxis') && this.get('xAxis').ticks) {
            compositeChart.xAxis().ticks(this.get('xAxis').ticks);
        }

        compositeChart.yAxis().tickSizeOuter(0);
        if (this.get('yAxis') && this.get('yAxis').ticks) {
            compositeChart.yAxis().ticks(this.get('yAxis').ticks);
            if (this.get('yAxis.formatter')) {
                compositeChart.yAxis().tickFormat(this.get('yAxis.formatter'));
            }
        }

        let lineCharts = [];
        let lineChart;
        let tip = this.createTooltip();

        this.get('group').forEach((g, index) => {
            lineChart = dc.lineChart(compositeChart, this.get('uniqueChartGroupName'));

            lineChart
                .group(g)
                .colors(this.get('colors')[index])
                .renderTitle(false)
                .elasticY(true);

            lineCharts.push(lineChart);
        });

        addComparisonLineTicks(compositeChart, this.get('comparisonLines'));
        addDomainTicks(compositeChart, this.get('yAxis').domain, this.get('comparisonLines') ? this.get('comparisonLines').map(d => d.value) : undefined);

        compositeChart
            .on('renderlet', chart => this.onRenderlet(chart, tip))
            .compose(lineCharts);

        this.set('chart', compositeChart);
    },

    createTooltip() {
        const formatter = this.get('xAxis.formatter') || (value => value);
        const titles = this.get('series').map(entry => entry.title);
        let tip = d3Tip().attr('class', `d3-tip ${this.get('elementId')}`)
            .html(d => {
                if (!isEmpty(titles)) {
                    let str = `<span class="tooltip-time">${moment(d.data.key).format(this.get('tooltipDateFormat'))}</span>`;
                    titles.forEach((title, i) => {
                        const value = this.get('data')[d.data.key][i];
                        const formattedValue = formatter(value);
                        const secondaryClass = d.y === value ? 'primary-stat' : '';
                        str = str.concat(`<span class="tooltip-list-item"><span class="tooltip-label ${secondaryClass}">${title}</span><span class="tooltip-value ${secondaryClass}">${formattedValue}</span></span>`);
                    });
                    return str;
                }

                return `<span>${moment(d.data.key).format('L')}</span><br/><span class="tooltip-value">${d.data.value}</span>`;
            });

        return tip;
    },

    onRenderlet(chart, tip) {
        // This is outside the Ember run loop so check if component is destroyed
        if (this.get('isDestroyed') || this.get('isDestroying')) {
            return;
        }

        this.addClickHandlersAndTooltips(d3.select('.line-chart > svg > defs'), tip);

        let dots = chart.selectAll('.sub._0 circle.dot')._groups[0];

        const chartId = this.get('chartId');
        let labels = document.querySelector(`#${chartId} .inline-labels`);
        if (labels) {
            labels.remove();
        }

        // Show min and max values over lines
        if (this.get('showMaxMin') && typeof this.get('seriesMaxMin') === 'number' && dots.length > 0) {
            this.addMaxMinLabels(dots);
        }

        if (this.get('showComparisonLines') && this.get('comparisonLines') && !isEmpty(this.get('data'))) {
            addComparisonLines(chart, this.get('comparisonLines'));
        }

        if (this.get('showCurrentIndicator') && this.get('currentInterval')) {
            this.changeTickForCurrentInterval();
        }

        const showLegend = this.get('legendOptions.showLegend');

        if (showLegend) {
            const chartWidth = this.get('chartWidth');
            const legendables = this.getLegendables(chart);
            const shouldAppendLegendBelow = this.get('legendOptions.shouldAppendLegendBelow');

            if (!shouldAppendLegendBelow) {
                const margins = chart.margins();
                const offsetX = chart.width() - margins.right + ChartSizes.LEGEND_OFFSET_X;

                const legendG = chart.select('g')
                    .append('g')
                    .attr('transform', `translate(${offsetX})`);

                this.addLegend(chart, legendables, legendG, 18, chartWidth);
            }

            if (shouldAppendLegendBelow) {
                const legendSvg = d3.select(this.element.querySelector('svg.legend'));
                this.addLowerLegend(chart, legendables, legendSvg);
            }
        }
    },

    getLegendables(chart) {
        const elements = chart.selectAll('path.line');

        return this.getWithDefault('series', []).map((s, i) => ({
            title: s.title,
            color: this.getColorAtIndex(i),
            elements: elements.filter((d, elementIndex) => elementIndex === i)
        }));
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
            let currentTick = this.get('chart').select('svg > g > g.axis').selectAll('g.tick')
                .filter(d => d.toString() === indicatorDate.toString());
            if (currentTick && !currentTick.empty() && currentTick.select('text').text().indexOf('\u25C6') === -1) {
                let tickHtml = this.isIntervalIncluded(xTimeScale.ticks(this.get('xAxis').ticks), indicatorDate) ? `\u25C6 ${currentTick.text()}` : '\u25C6';
                currentTick.select('text').classed('current-interval', true).html(tickHtml);
            }
        }
    },

    addMaxMinLabels(dots) {
        let formatter = this.get('xAxis.formatter') || (value => value);
        let maxValue, maxIdx, minValue, minIdx, values, nonZeroValues;
        let groups = this.get('group');
        groups.forEach((g, index) => {
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
        });
        let gLabels = d3.select(dots[0].parentNode).append('g').attr('class', 'inline-labels');
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

        const chartId = this.get('chartId');
        let compositeChart = dc.compositeChart(`#${chartId}`, this.get('uniqueChartGroupName'));

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
            lineChart = dc.lineChart(compositeChart, this.get('uniqueChartGroupName'));

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
