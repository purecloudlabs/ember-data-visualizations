import Ember from 'ember';
import moment from 'moment';
import _ from 'lodash/lodash';
import d3 from 'd3';
import dc from 'dc';

/**
   @public
   @module column-chart
   @type component
   @desc dc.js column chart
*/
export default Ember.Component.extend({
    classNames: ['chart column-chart'],

    resizeDetector: Ember.inject.service(),

    colors: [
        '#1f77b4', '#ff7f0e', '#2ca02c',
        '#9467bd', '#8c564b', '#e377c2',
        '#7f7f7f', '#bcbd22', '#17becf'
    ],

    showMaxMin: false,
    showComparisonLine: false,
    instantRun: false,
    maxMinSeries: null,
    group: null,
    dimension: null,
    seriesData: null,
    data: null,
    series: [],
    height: 200,
    xAxis: {},
    yAxis: {},
    currentInterval: null,
    showCurrentIndicator: false,

    isChartAvailable: true,
    chartNotAvailableMessage: null,
    chartNotAvailableTextColor: '#888888',
    chartNotAvailableColor: '#b3b3b3',

    // Horizontal line to mark a target, average, or any kind of comparison value
    // Ex. { value: 0.8, displayValue: '80%', color: '#2CD02C' }
    comparisonLine: null,

    onClick() { },

    tooltipDateFormat: 'll LT',

    type: 'GROUPED', // GROUPED, LAYERED (overlapping, first series in back -- should only be used for proportions), TODO: add STACKED

    // REQUIRED: group, dimension, xAxis.domain unless !isChartAvailable
    createChart() {
        const oldChart = this.get('chart');

        if (oldChart) {
            oldChart.on('renderlet', null);
            oldChart.on('postRender', null);
        }

        if (this.$() && this.$().parents() && !_.isEmpty(this.$().parents().find('.d3-tip'))) {
            this.$().parents().find('.d3-tip').remove();
        }

        if (!this.get('isChartAvailable')) {
            this.showChartNotAvailable();
            return;
        }

        if (!this.get('group') || !this.get('group.0.all') || !this.get('dimension')) {
            return false;
        }

        const getIndexForHatch = function (idx) {
            let i = 0;
            let count = 0;
            while (i <= idx) {
                if (series[i] && series[i].hatch) {
                    count++;
                }
                i++;
            }
            return count + idx;
        };

        let columnCharts = [];
        let columnChart;
        let compositeChart = dc.compositeChart(`#${this.get('elementId')}`).renderTitle(false);

        const colors = this.get('colors');
        const showMaxMin = this.get('showMaxMin');
        const seriesMaxMin = this.get('seriesMaxMin');
        const series = this.get('series');
        const onClick = this.onClick;

        const xAxis = this.get('xAxis');
        const yAxis = this.get('yAxis');
        const xTimeScale = d3.time.scale().domain(xAxis.domain);

        const indicatorDate = this.get('currentInterval') ? this.get('currentInterval.start._d') : null;
        const showCurrentIndicator = this.get('showCurrentIndicator');

        const titles = this.get('series').map(entry => entry.title);

        const data = this.get('data');
        const tooltipDateFormat = this.get('tooltipDateFormat');
        const formatter = this.get('xAxis.formatter') || (value => value);

        function isIntervalIncluded(scale, interval) {
            let scaleTicksStrings = [];
            for (let i = 0; i < scale.ticks().length; i++) {
                scaleTicksStrings.push(scale.ticks()[i].toString());
            }
            return scaleTicksStrings.includes(interval.toString());
        }

        function isIntervalInRange(scale, interval) {
            return (scale.ticks().pop() >= interval && scale.ticks()[0] <= interval);
        }

        let tip = d3.tip().attr('class', 'd3-tip').html(function (d) {
            if (!_.isEmpty(titles)) {
                let str = `<span class="tooltip-time">${moment(d.data.key).format(tooltipDateFormat)}</span>`;
                titles.forEach((title, i) => {
                    const datum = formatter(data[d.data.key][i]);
                    str = str.concat(`<span class="tooltip-list-item"><span class="tooltip-label">${title}</span><span class="tooltip-value">${datum}</span></span>`);
                });
                return str;
            }

            return `<span>${moment(d.data.key).format('L')}</span><br/><span class="tooltip-value">${d.data.value}</span>`;
        });

        let maxValue, maxIdx, minValue, minIdx, values, nonZeroValues;

        const groups = this.get('group');
        groups.forEach((g, index) => {
            if (showMaxMin && _.isNumber(seriesMaxMin)) {
                if (index === seriesMaxMin) {
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

            // If we are hatching, we need to display a white bar behind the hatched bar
            if (!_.isEmpty(series) && !_.isEmpty(series[index]) && series[index].hatch) {
                columnChart = dc.barChart(compositeChart);

                columnChart
                    .centerBar(true)
                    .barPadding(0.00)
                    .group(g)
                    .colors('white')
                    .renderTitle(false);

                columnCharts.push(columnChart);
            }

            columnChart = dc.barChart(compositeChart);

            columnChart
                .centerBar(true)
                .barPadding(0.00)
                .group(g)
                .colors(colors[index])
                .renderTitle(false);

            columnCharts.push(columnChart);
        });

        this.set('chart', compositeChart);

        this.get('chart').dimension(this.get('dimension'));

        this.get('chart')
            .brushOn(false)
            .height(this.get('height'))
            .margins({
                top: 10,
                right: 100,
                bottom: 50,
                left: 100
            })
            .x(xTimeScale)
            .xUnits(() => groups[0].size() * (groups.length + 1));

        if (this.get('width')) {
            this.get('chart').width(this.get('width'));
        }

        if (yAxis && yAxis.domain) {
            this.get('chart').y(d3.scale.linear().domain(yAxis.domain));
        }
        const type = this.get('type');
        this.get('chart')
            .on('renderlet', chart => {
                // This is outside the Ember run loop so check if component is destroyed
                if (this.get('isDestroyed') || this.get('isDestroying')) {
                    return;
                }

                // Set up any necessary hatching patterns
                let svg = d3.select('.column-chart > svg > defs');

                svg.append('clippath')
                    .attr('id', 'topclip')
                    .append('rect')
                    .attr('x', '0')
                    .attr('y', '0')
                    .attr('width', 200)
                    .attr('height', 200);

                series.forEach((series, index) => {
                    if (series.hatch === 'pos') {
                        svg.append('pattern')
                            .attr('id', `diagonalHatch${index}`)
                            .attr('patternUnits', 'userSpaceOnUse')
                            .attr('width', 4)
                            .attr('height', 4)
                            .attr('patternTransform', 'rotate(45)')
                            .append('rect')
                            .attr('x', '0')
                            .attr('y', '0')
                            .attr('width', 2)
                            .attr('height', 4)
                            .attr('fill', colors[index]);

                        chart.selectAll(`.sub._${getIndexForHatch(index)} rect.bar`)
                            .attr('fill', `url(#diagonalHatch${index})`)
                            .attr('opacity', '.7');

                    } else if (series.hatch === 'neg') {
                        svg.append('pattern')
                            .attr('id', `diagonalHatch${index}`)
                            .attr('patternUnits', 'userSpaceOnUse')
                            .attr('width', 4)
                            .attr('height', 4)
                            .attr('patternTransform', 'rotate(-45)')
                            .append('rect')
                            .attr('x', '0')
                            .attr('y', '0')
                            .attr('width', 2)
                            .attr('height', 4)
                            .attr('fill', colors[index]);

                        chart.selectAll(`.sub._${getIndexForHatch(index)} rect.bar`)
                            .attr('fill', `url(#diagonalHatch${index})`)
                            .attr('opacity', '.7');
                    }
                });

                chart.selectAll('rect.bar')
                    .attr('rx', '2')
                    .attr('stroke', 'white');

                const gap = 2;
                let bars = chart.selectAll('.sub._0 rect.bar')[0];
                let firstBar = bars[0];
                const seriesCount = groups.length;

                if (firstBar) {
                    let barWidth = (parseInt(d3.select(firstBar).attr('width'), 10)) || 1;

                    // if composed, double barWidth
                    if (type === 'LAYERED') {
                        let x;
                        let barD3;
                        chart.selectAll('rect.bar')[0].forEach(bar => {
                            barD3 = d3.select(bar);
                            x = parseInt(barD3.attr('x'), 10);
                            barD3.attr('x', x - barWidth * (groups.length - 1) / 2 + 1);
                        });

                        barWidth *= groups.length; // number of series
                    }

                    let position = -1 * (barWidth + gap);

                    for (let i = 0; i < seriesCount; i++) {
                        if (type === 'GROUPED') {
                            chart.selectAll(`g.sub._${i}`)
                                .attr('transform', `translate(${position},0)`);
                        }

                        position = position + (barWidth + gap);
                    }
                    chart.selectAll('rect.bar')
                        .attr('width', barWidth);

                }

                svg.call(tip);

                // clicking actions
                chart.selectAll('rect.bar').on('click', function (d) {
                    onClick(d);
                });

                chart.selectAll('rect').on('mouseover', tip.show)
                    .on('mouseout', tip.hide);

                $(`#${this.get('elementId')} #inline-labels`).remove();

                // Show min and max values over bars
                if (showMaxMin && _.isNumber(seriesMaxMin) && bars.length > 0) {
                    let gLabels = d3.select(firstBar.parentNode).append('g').attr('id', 'inline-labels');
                    let b = bars[maxIdx];

                    // Choose the tallest bar in the stack (lowest y value) and place the max/min labels above that.
                    // Avoids label falling under any bar in the stack.
                    const maxLabelY = Math.min(...chart.selectAll(`.sub rect.bar:nth-of-type(${maxIdx + 1})`)[0].map(rect => parseInt(rect.getAttribute('y'), 10)));

                    if (b) {
                        gLabels.append('text')
                            .text(maxValue)
                            .attr('x', +b.getAttribute('x') + (b.getAttribute('width') / 2))
                            .attr('y', Math.max(12, maxLabelY - 2))
                            .attr('text-anchor', 'middle')
                            .attr('font-size', '12px')
                            .attr('fill', colors[seriesMaxMin]);

                        if (!(maxIdx === minIdx)) {
                            gLabels.append('text')
                                // unicode for font-awesome caret up
                                .html(() => '&#xf0d8')
                                .attr('text-anchor', 'middle')
                                .attr('class', 'caret-icon')
                                .attr('x', +b.getAttribute('x') + (b.getAttribute('width') / 2))
                                .attr('y', maxLabelY - 12);
                        }
                    }

                    b = bars[minIdx];

                    if (b && !(maxIdx === minIdx)) {
                        gLabels.append('text')
                            .text(minValue)
                            .attr('x', +b.getAttribute('x') + (b.getAttribute('width') / 2))
                            .attr('y', Math.max(12, maxLabelY - 2))
                            .attr('text-anchor', 'middle')
                            .attr('font-size', '12px')
                            .attr('fill', colors[seriesMaxMin]);

                        gLabels.append('text')
                            // unicode for font-awesome caret down
                            .html(() => '&#xf0d7')
                            .attr('class', 'caret-icon')
                            .attr('text-anchor', 'middle')
                            .attr('x', +b.getAttribute('x') + (b.getAttribute('width') / 2))
                            .attr('y', maxLabelY - 12);
                    }
                }

                if (this.get('showComparisonLine') && this.get('comparisonLine') && !_.isEmpty(data)) {
                    const chartBody = d3.select('.column-chart > svg > g');
                    const line = this.get('comparisonLine');

                    chartBody.append('svg:line')
                        .attr('x1', 100)
                        .attr('x2', chart.width() - 95)
                        .attr('y1', 10 + chart.y()(line.value))
                        .attr('y2', 10 + chart.y()(line.value))
                        .style('stroke', line.color || '#2CD02C');

                    chartBody.append('svg:line')
                        .attr('x1', 100)
                        .attr('x2', 100)
                        .attr('y1', 15 + chart.y()(line.value))
                        .attr('y2', 5 + chart.y()(line.value))
                        .style('stroke', line.color || '#2CD02C');

                    chartBody.append('svg:line')
                        .attr('x1', chart.width() - 95)
                        .attr('x2', chart.width() - 95)
                        .attr('y1', 15 + chart.y()(line.value))
                        .attr('y2', 5 + chart.y()(line.value))
                        .style('stroke', line.color || '#2CD02C');

                    chartBody.append('text')
                        .text(line.displayValue)
                        .attr('x', 80)
                        .attr('y', 14 + chart.y()(line.value))
                        .attr('text-anchor', 'middle')
                        .attr('font-size', '12px')
                        .attr('fill', line.textColor || '#000000');
                }

                // change the tick with the date to include the indicator (happens after tick has been added)
                if (indicatorDate && showCurrentIndicator) {
                    let xTimeScale = d3.time.scale().domain(this.get('xAxis').domain);
                    if (isIntervalInRange(xTimeScale, indicatorDate)) {
                        let currentTick = d3.select('.column-chart > svg > g > g.axis').selectAll('g.tick')
                            .filter(d => d.toString() === indicatorDate.toString());
                        let tickHtml = isIntervalIncluded(xTimeScale, indicatorDate) ? `\u25C6 ${currentTick.text()}` : '\u25C6';
                        currentTick.select('text').html(tickHtml);
                    }
                }
            })
            .compose(columnCharts);

        this.get('chart').xAxis().outerTickSize(0);

        // if indicatorDate is in range but not already in the scale, add it.
        if (indicatorDate && showCurrentIndicator) {
            if (!isIntervalIncluded(xTimeScale, indicatorDate) && isIntervalInRange(xTimeScale, indicatorDate)) {
                let ticks = xTimeScale.ticks();
                ticks.push(indicatorDate);
                this.get('chart').xAxis().ticks(ticks.length).tickValues(ticks);
            }
        }
        this.get('chart').yAxis().outerTickSize(0);

        if (yAxis && yAxis.ticks) {
            this.get('chart').yAxis().ticks(yAxis.ticks);
        }

        this.renderChart();
    },

    resizeTimer: null,

    onResizeDebounced: null,

    setupResize() {
        this.set('onResizeDebounced', () => {
            this.set('resizeTimer', Ember.run.debounce(this, this.createChart, 100, this.get('instantRun')));
        });

        this.set('callback', Ember.run.bind(this, this.onResizeDebounced));
        this.get('resizeDetector').setup(`#${this.get('elementId')}`, this.get('callback'));
    },

    tearDownResize() {
        this.get('resizeDetector').teardown(`#${this.get('elementId')}`, this.get('callback'));
    },

    cancelTimers() {
        Ember.run.cancel(this.get('resizeTimer'));
    },

    renderChart() {
        this.get('chart').render();
    },

    didReceiveAttrs() {
        this._super(...arguments);

        let data = {};
        _.forEach(this.get('group'), g => {
            _.forEach(g.all(), datum => {
                if (data[datum.key]) {
                    data[datum.key].push(datum.value);
                } else {
                    data[datum.key] = [datum.value];
                }
            });
        });
        this.set('data', data);

        // Must schedule for afterRender as createChart depends on existence of component's element
        Ember.run.scheduleOnce('afterRender', this, this.setupResize);
    },

    willDestroyElement() {
        this._super(...arguments);
        this.tearDownResize();
        this.cancelTimers();
    },

    showChartNotAvailable() {
        const chartNotAvailableMessage = this.get('chartNotAvailableMessage');
        const chartNotAvailableColor = this.get('chartNotAvailableColor');
        const chartNotAvailableTextColor = this.get('chartNotAvailableTextColor');
        const xAxis = this.get('xAxis');
        const yAxis = this.get('yAxis');
        const formatter = this.get('xAxis.formatter') || (value => value);

        let columnChart = dc.barChart(`#${this.get('elementId')}`);
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

        const xTimeScale = d3.time.scale().domain(xAxis.domain);
        const data = xTimeScale.ticks(ticks);
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
            .x(xTimeScale)
            .xUnits(() => data.length + 1)
            .y(d3.scale.linear().domain([0, 1]))
            .group(group)
            .dimension(dimension);

        if (this.get('width')) {
            this.get('chart').width(this.get('width'));
        }

        columnChart.on('renderlet', chart => {
            // This is outside the Ember run loop so check if component is destroyed
            if (this.get('isDestroyed') || this.get('isDestroying')) {
                return;
            }

            // Set up any necessary hatching patterns
            let svg = d3.select('.column-chart > svg > defs');

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
                .attr('id', `chartNotAvailableHatch`)
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
                .attr('fill', `url(#chartNotAvailableHatch)`)
                .attr('opacity', '.7')
                .attr('rx', '2')
                .attr('stroke', 'white');
        });

        columnChart.on('postRender', chart => {
            // reenable transitions once we're done... it's a global.
            dc.disableTransitions = false;

            // This is outside the Ember run loop so check if component is destroyed
            if (this.get('isDestroyed') || this.get('isDestroying')) {
                return;
            }

            d3.select('.column-chart > svg > text').remove();
            let svg = d3.select('.column-chart > svg');
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

        if (yAxis && yAxis.ticks) {
            this.get('chart').yAxis().ticks(yAxis.ticks);
        }

        // we don't want to animate the transitions for the "no chart" view.
        dc.disableTransitions = true;
        columnChart.render();
    }
});
