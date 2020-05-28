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
import { padDomain, addDomainTicks } from 'ember-data-visualizations/utils/domain-tweaks';
import { computed } from '@ember/object';
import { equal, bool } from '@ember/object/computed';

import layout from './template';

/**
   @public
   @module column-chart
   @type component
   @desc dc.js column chart
*/
export default BaseChartComponent.extend({
    layout,
    classNames: ['column-chart'],

    showMaxMin: false,
    showComparisonLines: false,
    currentInterval: null,
    showCurrentIndicator: false,
    maxMinSeries: null,
    type: 'GROUPED', // GROUPED, LAYERED, STACKED,
    elementToApplyTipSelector: 'rect.bar',

    chartId: computed('elementId', function () {
        const elementId = this.get('elementId');
        return `column-chart-${elementId}`;
    }),

    legendOptions: null,

    showLegend: bool('legendOptions.showLegend'),
    shouldAppendLegendBelow: equal('legendOptions.position', 'bottom'),

    legendHeight: computed('legendOptions.height', function () {
        return this.get('legendOptions.height') || ChartSizes.LEGEND_HEIGHT;
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
        const showLegend = this.get('showLegend');
        const shouldAppendLegendBelow = this.get('shouldAppendLegendBelow');

        // if the legend renders on the right, give the right margin enough room to render the legend
        const legendWidth = this.get('legendWidth') || ChartSizes.LEGEND_WIDTH;
        const legendInsetX = legendWidth + ChartSizes.LEGEND_OFFSET_X;

        const rightMargin = showLegend && !shouldAppendLegendBelow ? legendInsetX : ChartSizes.RIGHT_MARGIN;

        // if the legend renders below the chart, we want the chart as close to the bottom as possible
        const bottomMargin = showLegend && !shouldAppendLegendBelow ? ChartSizes.BOTTOM_MARGIN : 20;

        // let d3 handle scaling if not otherwise specified
        const useElasticY = !this.get('yAxis.domain');

        compositeChart
            .transitionDuration(0)
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
            .dimension(this.get('dimension'))
            .elasticY(useElasticY)
            .yAxisPadding('40%');

        if (this.get('width')) {
            compositeChart.width(this.get('width'));
        }

        if (this.get('yAxis.domain')) {
            compositeChart.y(d3.scaleLinear().domain(padDomain(this.get('yAxis').domain)));
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

        let tip = this.createTooltip();
        let columnChart;
        let columnCharts = [];
        const groups = this.get('group');

        if (this.get('type') !== 'STACKED') {
            groups.forEach((g, index) => {
                // If we are hatching, we need to display a white bar behind the hatched bar
                if (!isEmpty(this.get('series')) && !isEmpty(this.get('series')[index]) && this.get('series')[index].hatch) {
                    columnChart = dc.barChart(compositeChart, this.get('uniqueChartGroupName'));

                    columnChart
                        .centerBar(true)
                        .barPadding(0.00)
                        .group(g)
                        .colors('white')
                        .renderTitle(false)
                        .elasticY(true);

                    columnCharts.push(columnChart);
                }

                columnChart = dc.barChart(compositeChart, this.get('uniqueChartGroupName'));

                columnChart
                    .centerBar(true)
                    .barPadding(0.00)
                    .group(g)
                    .colors(d3.scaleQuantize().domain([0, this.get('colors').length - 1]).range(this.get('colors')))
                    .renderTitle(false)
                    .elasticY(true)
                    .colorAccessor(d => {
                        const activeAlert = this.determineActiveAlertLine(d.value);
                        return activeAlert ? activeAlert.alertColorIndex : index;
                    });

                columnCharts.push(columnChart);
            });
        } else {
            columnChart = dc.barChart(compositeChart, this.get('uniqueChartGroupName'));
            columnChart
                .centerBar(true)
                .barPadding(0.00)
                .group(groups[0])
                .renderTitle(false)
                .elasticY(true);
            groups.forEach((g, index) => {
                if (index != 0) {
                    columnChart.stack(g);
                }
            });
            columnCharts.push(columnChart);
        }

        addComparisonLineTicks(compositeChart, this.get('comparisonLines'));
        addDomainTicks(compositeChart, this.get('yAxis').domain, this.get('comparisonLines') ? this.get('comparisonLines').map(d => d.value) : undefined);

        compositeChart
            .on('pretransition', chart => this.onPretransition(chart, tip))
            .compose(columnCharts);

        this.set('chart', compositeChart);
    },

    createTooltip() {
        const chartId = this.get('chartId');
        const formatter = this.get('xAxis.formatter') || (value => value);
        const titles = this.getWithDefault('series', []).map(entry => entry.title);

        let tip = d3Tip().attr('class', `d3-tip ${chartId}`)
            .html(d => {
                if (!isEmpty(titles)) {
                    let str = `<span class="tooltip-time">${moment(d.data.key).format(this.get('tooltipDateFormat'))}</span>`;
                    this.get('series').forEach((series, i) => {
                        if (!series.alert) {
                            const value = this.get('data')[d.data.key][i];
                            const formattedValue = formatter(value);
                            const secondaryClass = d.y === value ? 'primary-stat' : '';
                            str = str.concat(`<span class="tooltip-list-item"><span class="tooltip-label ${secondaryClass}">${series.title}</span><span class="tooltip-value ${secondaryClass}">${formattedValue}</span></span>`);
                        }
                    });
                    return str;
                }

                return `<span>${moment(d.data.key).format('L')}</span><br/><span class="tooltip-value">${d.data.value}</span>`;
            });

        return tip;
    },

    determineActiveAlertLine(value) {
        // Find the first applicable warning
        // Start with the lowest "below" warning to highest
        // Then look at highest "above" warning to lowest
        if (this.get('comparisonLines')) {
            const applicableBelowAlert = this.get('comparisonLines')
                .filter(w => w.alert === this.get('AlertType').BELOW && value < w.value)
                .sort((a, b) => a.value - b.value)[0];

            if (applicableBelowAlert) {
                return applicableBelowAlert;
            }

            const applicableAboveAlert = this.get('comparisonLines')
                .filter(w => w.alert === this.get('AlertType').ABOVE && value > w.value)
                .sort((a, b) => b.value - a.value)[0];

            if (applicableAboveAlert) {
                return applicableAboveAlert;
            }
        }
        return null;
    },

    doHatching(chart) {
        // Set up any necessary hatching patterns
        let svg = chart.select('svg > defs');
        let series = this.getWithDefault('series', []);

        this.getWithDefault('comparisonLines', []).forEach((line, index) => {
            series.push({ title: `pos alert hatch${index}`, hatch: 'pos', alert: true, replaceIndex: 0, activeAlertLine: line });
            series.push({ title: `neg alert hatch${index}`, hatch: 'neg', alert: true, replaceIndex: 1, activeAlertLine: line });
        });
        series.forEach((series, index) => {
            if (series.hatch) {
                let rotateAngle = series.hatch === 'pos' ? 45 : -45;
                // create hatch patterns
                svg.append('pattern')
                    .attr('id', `diagonalHatch${index}`)
                    .attr('patternUnits', 'userSpaceOnUse')
                    .attr('width', 4)
                    .attr('height', 4)
                    .attr('patternTransform', `rotate(${rotateAngle})`)
                    .append('rect')
                    .attr('width', 2)
                    .attr('height', 4)
                    .attr('fill', series.alert ? this.getColorAtIndex(series.activeAlertLine.alertColorIndex) : this.getColorAtIndex(index));

                // apply hatch patterns
                if (!series.alert) {
                    chart.selectAll(`.sub._${this.getIndexForHatch(index)} rect.bar`)
                        .attr('fill', `url(#diagonalHatch${index})`)
                        .attr('opacity', '.7');
                } else {
                    let _this = this;
                    chart.selectAll('rect.bar').filter(function (d) {
                        return d3.select(this).attr('fill') === `url(#diagonalHatch${series.replaceIndex})`
                            && _this.determineActiveAlertLine(d.data.value) === series.activeAlertLine;
                    })
                        .attr('fill', `url(#diagonalHatch${index})`)
                        .attr('opacity', '.7');
                }
            }
        });

        chart.selectAll('rect.bar')
            .attr('rx', '1')
            .attr('stroke', 'white');
    },

    handleBarWidth(chart) {
        const gap = 2;
        let bars = chart.selectAll('.sub._0 rect.bar')._groups[0];
        const seriesCount = this.get('group.length');

        if (bars[0] && seriesCount) {
            let barWidth = (parseInt(d3.select(bars[0]).attr('width'), 10)) || 1;

            // if composed, double barWidth
            if (this.get('type') === 'LAYERED' || this.get('type') === 'STACKED') {
                let x;
                let barD3;
                // convert NodeList to Array for IE 11 compatability
                let barList = Array.prototype.slice.call(chart.selectAll('rect.bar')._groups[0]);

                barList.forEach(bar => {
                    barD3 = d3.select(bar);
                    x = parseInt(barD3.attr('x'), 10);
                    barD3.attr('x', x - barWidth * (seriesCount - 1) / 2 + 1);
                });

                barWidth *= this.get('group.length'); // number of series
            }

            let position = -1 * (barWidth + gap);

            for (let i = 0; i < seriesCount; i++) {
                if (this.get('type') === 'GROUPED') {
                    chart.selectAll(`g.sub._${i}`)
                        .attr('transform', `translate(${position},0)`);
                }

                position = position + (barWidth + gap);
            }
            chart.selectAll('rect.bar')
                .attr('width', barWidth).each(function () {
                    const bar = d3.select(this);
                    if (bar.attr('height') !== '0') {
                        bar.attr('tabindex', 0);
                    }
                });
        }
    },

    onPretransition(chart, tip) {
        // This is outside the Ember run loop so check if component is destroyed
        if (this.get('isDestroyed') || this.get('isDestroying')) {
            return;
        }

        if (this.get('type') === 'STACKED') {
            chart.selectAll('g.stack').selectAll('rect').attr('fill', (d) => this.get('colors')[d.layer]);
        }

        this.doHatching(chart);
        this.handleBarWidth(chart);

        let svg = chart.select('svg > defs');
        let bars = chart.selectAll('.sub._0 rect.bar')._groups[0];

        this.addClickHandlersAndTooltips(svg, tip);

        const chartId = this.get('chartId');
        let labels = document.querySelector(`#${chartId} .inline-labels`);
        if (labels) {
            labels.remove();
        }

        if ((this.get('showMaxMin') || this.get('labelOptions.showMaxMin')) && typeof this.get('seriesMaxMin') === 'number' && bars.length > 0) {
            this.addMaxMinLabels(bars, chart);
        }

        if ((this.get('showDataValues') || this.get('labelOptions.showDataValues')) && typeof this.get('seriesMaxMin') === 'number' && bars.length > 0) {
            this.addDataValues(bars, chart);
        }

        if (!isEmpty(this.get('showComparisonLines')) && this.get('comparisonLines') && !isEmpty(this.get('data'))) {
            addComparisonLines(chart, this.get('comparisonLines'));
        }

        if (this.get('showCurrentIndicator') && this.get('currentInterval')) {
            this.changeTickForCurrentInterval();
        }

        const showLegend = this.get('showLegend');

        if (showLegend) {
            const series = this.get('series');
            const chartWidth = this.get('chartWidth');

            series.forEach((series, index) => {
                const title = series.title;
                const hatchIndex = this.getIndexForHatch(index);

                chart.selectAll(`.sub._${hatchIndex} rect.bar`).classed(title, true);
            });

            const legendables = this.getLegendables(chart);
            const shouldAppendLegendBelow = this.get('shouldAppendLegendBelow');

            if (!shouldAppendLegendBelow) {
                // append to the right of the chart
                const margins = chart.margins();
                const offsetX = chart.width() - margins.right + ChartSizes.LEGEND_OFFSET_X;

                const legendG = chart.select('g')
                    .append('g')
                    .attr('transform', `translate(${offsetX})`);

                this.addLegend(chart, legendables, legendG, 18, chartWidth);
            } else {
                // append below the chart
                const legendSvg = d3.select(this.element.querySelector('svg.legend'));

                const height = this.get('legendHeight');
                const fontSize = this.get('legendOptions.fontSize');

                this.addLowerLegend(chart, legendables, legendSvg, { height, fontSize });
            }
        }

        // account for negative y values
        let negs = false;
        if (this.get('group') && this.get('group')[0]) {
            this.get('group')[0].all().forEach(d => {
                if (d.value < 0) {
                    negs = true;
                }
            });
        }

        /*
         * this chunk of code adjusts the x-axis and bars so that the bars appear x-axis if data has negative values.
         * However, This was only done for 'GROUPED' column-chart, as a result, the 'LAYERED' column chart would not render negative values
         * below the x-axis.
         * Now, 'LAYERED' column-type is also added so that negative values are rendered in 'LAYERED' charts correctly.
         */
        if (negs && (['GROUPED', 'LAYERED'].indexOf(this.get('type').trim()) !== -1)) {
            const y0Chart = chart.selectAll('rect.bar').filter(d => d.y <= 0);
            if (!y0Chart.empty()) {
                const y0 = y0Chart.attr('y');
                chart.select('.axis.x path.domain')
                    .attr('transform', `translate(0,${-1 * (this.get('height') - chart.margins().top - chart.margins().bottom - y0)})`);
            }
        }
    },

    getLegendables(chart) {
        const data = this.get('data');

        return this.getWithDefault('series', []).filter(s => !s.alert).map((s, i) => ({
            title: s.title,

            elements: chart.selectAll('rect.bar').filter(function (d) {
                const keyData = data && d.data && data[d.data.key];
                return keyData && d.y === keyData[i] && d3.select(this).classed(s.title);
            }),

            color: s.hatch ? `url(#diagonalHatch${i})` : this.getColorAtIndex(i)
        }));
    },

    getIndexForHatch(idx) {
        let count = 0;
        for (let i = 0; i <= idx; i++) {
            if (this.get('series')[i] && this.get('series')[i].hatch) {
                count++;
            }
        }
        return count + idx;
    },

    isIntervalIncluded(ticks, interval) {
        return ticks.toString().includes(interval.toString());
    },

    isIntervalInRange(scale, interval) {
        return (scale.ticks().pop() >= interval && scale.ticks()[0] <= interval);
    },

    addTickForCurrentInterval() {
        // if indicatorDate is in range but not already in the scale, add it.
        let xscaleTime = d3.scaleTime().domain(this.get('xAxis').domain);
        let indicatorDate = this.get('currentInterval') ? this.get('currentInterval.start._d') : null;
        let ticks = xscaleTime.ticks(this.get('xAxis').ticks);
        if (!this.isIntervalIncluded(ticks, indicatorDate) && this.isIntervalInRange(xscaleTime, indicatorDate)) {
            ticks.push(indicatorDate);
        }
        return ticks;
    },

    changeTickForCurrentInterval() {
        // this method should be called on renderlet
        let indicatorDate = this.get('currentInterval.start._d');
        let xscaleTime = d3.scaleTime().domain(this.get('xAxis').domain);
        if (this.isIntervalInRange(xscaleTime, indicatorDate)) {
            let currentTick = this.get('chart').select('svg > g > g.axis').selectAll('g.tick')
                .filter(d => d.toString() === indicatorDate.toString());
            if (currentTick && !currentTick.empty() && currentTick.select('text').text().indexOf('\u25C6') === -1) {
                let tickHtml = this.isIntervalIncluded(xscaleTime.ticks(this.get('xAxis').ticks), indicatorDate) ? `\u25C6 ${currentTick.text()}` : '\u25C6';
                currentTick.select('text').classed('current-interval', true).html(tickHtml);
            }
        }
    },

    addDataValues(bars = [], chart) {
        const formatter = this.get('xAxis.formatter') || (value => value);
        const gLabels = d3.select(bars[0].parentNode).append('g').attr('id', 'data-labels');

        // min and max label elements
        const maxLabel = chart.select('.max-value-text');
        const minLabel = chart.select('.min-value-text');
        const areMinMaxDefined = maxLabel.node() && minLabel.node();

        // Choose the tallest bar in the stack (lowest y value) and place the data labels above that.
        // Avoids label falling under any bar in the stack.
        const yValues = { y: [], height: [] };
        this.get('chart').selectAll('.sub rect.bar').each(function () {
            yValues.y.push(parseInt(d3.select(this).attr('y')));
            yValues.height.push(parseInt(d3.select(this).attr('height')));
        });
        const maxLabelY = Math.min(...yValues.y);
        const maxLabelYHeight = Math.max(...yValues.height);
        // to indicate if chart has all negative values, so that data labels could be rendered at negative side of x -axis.
        const isBottomLabelPosition = this.get('yAxis').isBottomLabelPosition;

        let values;
        const groups = this.getWithDefault('group', []);
        groups.forEach((g, index) => {
            if (index === this.get('seriesMaxMin')) {
                values = g.all().map(gElem => gElem.value);
            }
        });

        /* auto adjust when to hide data value of a bar
         * if labels overlap.
         */
        if (this.get('labelOptions.labelCollisionResolution') === 'auto' && bars.length > 1) {
            const barWidth = Number(d3.select(bars[0]).attr('width'));
            const barGap = Math.abs(Number(d3.select(bars[0]).attr('x')) - Number(d3.select(bars[1]).attr('x'))) - barWidth;
            // how many labels to skip.
            let skipLabels = 0;
            for (let i = 0; i < bars.length; i++) {
                if (!values[i] || skipLabels > 0) {
                    skipLabels--; // !values[i] does not render the bar, the gap increases, it is equivalent to skipping a label.
                    continue;
                }
                // if min and max are rendered at i, dont overwrite them with data values.
                if (this.minMaxIndices && this.minMaxIndices.indexOf(i) != -1) {
                    continue;
                }
                const label = gLabels.append('text')
                    .text(() => formatter(values[i]))
                    .attr('x', () => +d3.select(bars[i]).attr('x'))
                    .attr('y', Math.max(12, isBottomLabelPosition ? maxLabelYHeight + 12 : maxLabelY - 2))
                    .attr('font-size', '12px')
                    .attr('fill', this.getWithDefault('colors', [])[this.get('seriesMaxMin')])
                    .attr('class', 'data-text')
                    .attr('id', `data-text-${i}`);
                if (areMinMaxDefined) {
                    const labelDimensions = label.node().getBBox();
                    const maxLabelDimensions = maxLabel.node().getBBox();
                    const minLabelDimensions = minLabel.node().getBBox();
                    const leftMostAmongMaxAndCurrentLabel = labelDimensions.x - maxLabelDimensions.x < 0 ? labelDimensions : maxLabelDimensions;
                    const leftMostAmongMinAndCurrentLabel = labelDimensions.x - minLabelDimensions.x < 0 ? labelDimensions : minLabelDimensions;
                    // check if label collides with min/max label
                    if (Math.abs(labelDimensions.x - maxLabelDimensions.x) < leftMostAmongMaxAndCurrentLabel.width
                        || Math.abs(labelDimensions.x - minLabelDimensions.x) < leftMostAmongMinAndCurrentLabel.width) {
                        label.remove();
                    } else {
                        // if the label width swallows 'n' barwidth + bargap, then skip n labels.
                        skipLabels = Math.ceil(labelDimensions.width / (barWidth + barGap)) - 1;
                    }
                }
            }
        } else {
            for (let i = 0; i < bars.length; i++) {
                if (!values[i]) {
                    continue;
                }
                gLabels.append('text')
                    .text(() => formatter(values[i]))
                    .attr('x', () => +d3.select(bars[i]).attr('x') + Number((d3.select(bars[i]).attr('width')) / 2))
                    .attr('y', Math.max(12, isBottomLabelPosition ? maxLabelYHeight + 12 : maxLabelY - 2))
                    .attr('text-anchor', 'middle')
                    .attr('font-size', '12px')
                    .attr('fill', this.getWithDefault('colors', [])[this.get('seriesMaxMin')])
                    .attr('class', 'data-text')
                    .attr('id', `data-text-${i}`);
            }
        }
    },

    addMaxMinLabels(bars) {
        const useAutoCollisionResolution = this.get('labelOptions.labelCollisionResolution') === 'auto';
        const formatter = this.get('xAxis.formatter') || (value => value);
        let maxValue, maxIdx, minValue, minIdx, values, nonZeroValues;
        const groups = this.get('group');
        // to indicate if chart has all negative values, so that max and min could be rendered at negative side of x -axis.
        const isBottomLabelPosition = this.get('yAxis').isBottomLabelPosition;
        groups.forEach((g, index) => {
            if (index === this.get('seriesMaxMin')) {
                values = g.all().map(gElem => gElem.value);
                nonZeroValues = values.filter(v => v !== 0);
                maxValue = Math.max(...nonZeroValues);
                maxIdx = values.indexOf(maxValue);
                maxValue = formatter(maxValue);
                minValue = Math.min(...nonZeroValues);
                minIdx = values.indexOf(minValue);
                minValue = formatter(minValue);
            }
        });
        const gLabels = d3.select(bars[0].parentNode).append('g').attr('class', 'inline-labels');
        let b = bars[maxIdx];

        // Choose the tallest bar in the stack (lowest y value) and place the max/min labels above that.
        // Avoids label falling under any bar in the stack.
        let yValues = { y: [], height: [] };
        this.get('chart').selectAll('.sub rect.bar').each(function () {
            yValues.y.push(parseInt(d3.select(this).attr('y')));
            yValues.height.push(parseInt(d3.select(this).attr('height')));
        });
        const maxLabelY = Math.min(...yValues.y);
        const maxLabelYHeight = Math.max(...yValues.height);

        let maxLabel, minLabel, minLabelIndicator;
        if (b) {
            maxLabel = gLabels.append('text')
                .text(maxValue)
                .attr('x', +b.getAttribute('x') + (useAutoCollisionResolution ? 0 : Number(b.getAttribute('width')) / 2))
                .attr('y', Math.max(12, isBottomLabelPosition ? maxLabelYHeight + 12 : maxLabelY - 2))
                .attr('text-anchor', useAutoCollisionResolution ? 'left' : 'middle')
                .attr('font-size', '12px')
                .attr('fill', this.get('colors')[this.get('seriesMaxMin')])
                .attr('class', 'max-value-text');

            if (!(maxIdx === minIdx)) {
                gLabels.append('text')
                    // unicode for font-awesome caret up
                    .html(() => '&#xf0d8')
                    .attr('text-anchor', useAutoCollisionResolution ? 'left' : 'middle')
                    .attr('class', 'caret-icon max-value-indicator')
                    .attr('x', +b.getAttribute('x') + (useAutoCollisionResolution ? 0 : Number(b.getAttribute('width')) / 2))
                    .attr('y', isBottomLabelPosition ? maxLabelYHeight + 24 : maxLabelY - 12);
            }
        }
        b = bars[minIdx];
        this.minMaxIndices = [minIdx, maxIdx]; // internal use only
        if (b && !(maxIdx === minIdx)) {
            minLabel = gLabels.append('text')
                .text(minValue)
                .attr('x', +b.getAttribute('x') + (useAutoCollisionResolution ? 0 : Number(b.getAttribute('width')) / 2))
                .attr('y', Math.max(12, isBottomLabelPosition ? maxLabelYHeight + 12 : maxLabelY - 2))
                .attr('text-anchor', useAutoCollisionResolution ? 'left' : 'middle')
                .attr('font-size', '12px')
                .attr('fill', this.get('colors')[this.get('seriesMaxMin')])
                .attr('class', 'min-value-text');

            minLabelIndicator = gLabels.append('text')
                // unicode for font-awesome caret down
                .html(() => '&#xf0d7')
                .attr('class', 'caret-icon min-value-indicator')
                .attr('text-anchor', useAutoCollisionResolution ? 'left' : 'middle')
                .attr('x', +b.getAttribute('x') + (useAutoCollisionResolution ? 0 : Number(b.getAttribute('width')) / 2))
                .attr('y', isBottomLabelPosition ? maxLabelYHeight + 24 : maxLabelY - 12);
        }
        const hasMaxLabel = maxLabel && !maxLabel.empty();
        const hasMinLabel = minLabel && !minLabel.empty();

        // if max and min labels collide, then remove the minLabel.
        if (useAutoCollisionResolution && hasMaxLabel && hasMinLabel) {
            const minLabelDimensions = minLabel.node().getBBox();
            const maxLabelDimensions = maxLabel.node().getBBox();
            const leftMostAmongMaxAndMin = maxLabelDimensions.x - minLabelDimensions.x < 0 ? maxLabelDimensions : minLabelDimensions;
            if (Math.abs(minLabelDimensions.x - maxLabelDimensions.x) < leftMostAmongMaxAndMin.width) {
                minLabel.remove();
                minLabelIndicator.remove();
            }

        }
    },

    showChartNotAvailable() {
        const chartNotAvailableMessage = this.get('chartNotAvailableMessage');
        const chartNotAvailableColor = this.get('chartNotAvailableColor');
        const chartNotAvailableTextColor = this.get('chartNotAvailableTextColor');
        const xAxis = this.get('xAxis');
        const yAxis = this.get('yAxis');

        const chartId = this.get('chartId');
        let columnChart = dc.barChart(`#${chartId}`, this.get('uniqueChartGroupName'));
        this.set('chart', columnChart);

        const duration = moment.duration(xAxis.domain[1].diff(xAxis.domain[0]));
        let ticks = 30;
        if (duration.asMonths() >= 1) {
            ticks = duration.asDays();
        } else if (duration.asWeeks() >= 1) {
            ticks = 30;
        } else if (duration.asDays() >= 1) {
            ticks = 24;
        }

        const data = d3.scaleTime().domain(xAxis.domain).ticks(ticks);
        const filter = crossfilter(data);
        const dimension = filter.dimension(d => d);
        const group = dimension.group().reduceCount(g => g);

        columnChart
            .centerBar(true)
            .barPadding(0.00)
            .colors(chartNotAvailableColor)
            .renderTitle(false)
            .brushOn(false)
            .height(this.get('height'))
            .margins({
                top: 10,
                right: 100,
                bottom: 50,
                left: 100
            })
            .x(d3.scaleTime().domain(xAxis.domain))
            .xUnits(() => data.length + 1)
            .y(d3.scaleLinear().domain([0, 1]))
            .group(group)
            .dimension(dimension)
            .transitionDuration(0);

        columnChart.xAxis().tickFormat(getTickFormat(this.get('d3LocaleInfo')));

        if (this.get('width')) {
            this.get('chart').effectiveWidth(this.get('width'));
        }

        columnChart.on('pretransition', chart => {
            // This is outside the Ember run loop so check if component is destroyed
            if (this.get('isDestroyed') || this.get('isDestroying')) {
                return;
            }

            // Set up any necessary hatching patterns
            let svg = d3.select('.column-chart .dc-chart > svg > defs');

            svg
                .append('clippath')
                .attr('id', 'topclip')
                .append('rect')
                .attr('x', '0')
                .attr('y', '0')
                .attr('width', 200)
                .attr('height', 200);
            svg
                .append('pattern')
                .attr('id', 'chartNotAvailableHatch')
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

            chart.selectAll('rect.bar')
                .attr('fill', 'url(#chartNotAvailableHatch)')
                .attr('opacity', '.7')
                .attr('rx', '1')
                .attr('stroke', 'white');
        });

        columnChart.on('postRender', () => {
            // This is outside the Ember run loop so check if component is destroyed
            if (this.get('isDestroyed') || this.get('isDestroying')) {
                return;
            }

            this.get('chart').select('svg > text').remove();
            let svg = this.get('chart').select('svg');
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

        columnChart.render();
    }
});
