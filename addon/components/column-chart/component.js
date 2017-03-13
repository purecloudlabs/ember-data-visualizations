/* global _, $, moment, d3, dc */

import Ember from 'ember';

/**
   @public
   @module column-chart
   @type component
   @desc dc.js column chart
*/
export default Ember.Component.extend({
    classNames: ['chart column-chart'],

    colors: [
        '#1f77b4', '#ff7f0e', '#2ca02c',
        '#9467bd', '#8c564b', '#e377c2',
        '#7f7f7f', '#bcbd22', '#17becf'
    ],

    showMaxMin: false,
    maxMinSeries: null,
    group: null,
    dimension: null,
    seriesData: null,
    data: null,
    series: [],
    height: 200,
    xAxis: {},
    yAxis: {},

    onClick() {},

    tooltipDateFormat: 'L LT',

    type: 'GROUPED', // GROUPED, LAYERED (overlapping, first series in back -- should only be used for proportions), TODO: add STACKED

    // REQUIRED: group, dimension, xAxis.domain
    createChart() {
        if (this.$() && this.$().parents() && !_.isEmpty(this.$().parents().find('.d3-tip'))) {
            this.$().parents().find('.d3-tip').remove();
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
        let compositeChart = dc.compositeChart(`#${this.get('elementId')}`);

        const colors = this.get('colors');
        const showMaxMin = this.get('showMaxMin');
        const seriesMaxMin = this.get('seriesMaxMin');
        const series = this.get('series');
        const onClick = this.onClick;

        const xAxis = this.get('xAxis');
        const yAxis = this.get('yAxis');

        const titles = _.map(this.get('series'), 'title');

        const data = this.get('data');
        const tooltipDateFormat = this.get('tooltipDateFormat');
        const formatter = this.get('xAxis.formatter') || (value => value);

        let tip = d3.tip().attr('class', 'd3-tip').html(function (d) {
            if (!_.isEmpty(titles)) {
                let str = `<span class="tooltip-time">${moment(d.data.key).format(tooltipDateFormat)}</span><br/>`;
                _.forEach(titles, function (title, i) {
                    const datum = formatter(data[d.data.key][i]);
                    str = str.concat(`<span class="tooltip-value">${title}: ${datum}</span><br/>`);
                });
                return str;
            }

            return `<span>${moment(d.data.key).format('L')}</span><br/><span class="tooltip-value">${d.data.value}</span>`;
        });

        let maxValue, maxIdx, minValue, minIdx, values, nonZeroValues;

        const groups = this.get('group');
        _.forEach(groups, function (g, index) {
            if (showMaxMin && _.isNumber(seriesMaxMin)) {
                if (index === seriesMaxMin) {
                    values = _.map(g.all(), 'value');
                    nonZeroValues = _.filter(values, v => v > 0);
                    maxValue = formatter(_.max(nonZeroValues));
                    maxIdx = _.indexOf(values, maxValue);
                    minValue = formatter(_.min(nonZeroValues));
                    minIdx = _.indexOf(values, minValue);
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
            .x(d3.time.scale().domain(xAxis.domain))
            .xUnits(() => groups[0].size() * (groups.length + 1));

        if (this.get('width')) {
            this.get('chart').width(this.get('width'));
        }

        if (yAxis && yAxis.domain) {
            this.get('chart').y(d3.scale.linear().domain(yAxis.domain));
        }
        const type = this.get('type');
        this.get('chart')
            .renderlet(chart => {
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

                _.forEach(series, function (series, index) {
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

                // Show min and max values over bars
                if (showMaxMin && _.isNumber(seriesMaxMin)) {
                    d3.select(bars[0].parentNode).select('#inline-labels').remove();
                    let gLabels = d3.select(bars[0].parentNode).append('g').attr('id', 'inline-labels');
                    let b = bars[maxIdx];
                    if (b) {
                        gLabels.append('text')
                        .text(maxValue)
                        .attr('x', +b.getAttribute('x') + (b.getAttribute('width') / 2))
                        .attr('y', Math.max(12, +b.getAttribute('y') - 5))
                        .attr('text-anchor', 'middle')
                        .attr('font-size', '12px')
                        .attr('fill', colors[seriesMaxMin]);
                    }

                    b = bars[minIdx];

                    if (b) {
                        gLabels.append('text')
                        .text(minValue)
                        .attr('x', +b.getAttribute('x') + (b.getAttribute('width') / 2))
                        .attr('y', Math.max(12, +b.getAttribute('y') - 5))
                        .attr('text-anchor', 'middle')
                        .attr('font-size', '12px')
                        .attr('fill', colors[seriesMaxMin]);
                    }
                }
            })
            .compose(columnCharts);

        this.get('chart').xAxis().outerTickSize(0);

        if (xAxis && xAxis.ticks) {
            this.get('chart').xAxis().ticks(xAxis.ticks);
        }

        this.get('chart').yAxis().outerTickSize(0);

        if (yAxis && yAxis.ticks) {
            this.get('chart').yAxis().ticks(yAxis.ticks);
        }

        this.renderChart();
    },

    resizeTimer: null,
    onResize: null,

    setupResize() {
        this.set('onResize', () => {
            if (this.$() && this.$().parents() && !_.isEmpty(this.$().parents().find('.d3-tip'))) {
                this.$().parents().find('.d3-tip').remove();
            }
            this.set('resizeTimer', Ember.run.debounce(this, this.createChart, 500));
        });

        $(window).resize(this.get('onResize'));
    },

    tearDownResize() {
        $(window).off('resize', this.get('onResize'));
    },

    cancelTimers() {
        Ember.run.cancel(this.get('resizeTimer'));
    },

    renderChart() {
        this.get('chart').render();
    },

    didReceiveAttrs({ newAttrs }) {
        this._super(...arguments);
        this.set('dimension', Ember.get(newAttrs, 'dimension.value'));
        this.set('group', Ember.get(newAttrs, 'group.value'));

        let data = {};
        _.each(this.get('group'), function (g) {
            _.each(g.all(), function (datum) {
                if (data[datum.key]) {
                    data[datum.key].push(datum.value);
                } else {
                    data[datum.key] = [datum.value];
                }
            });
        });
        this.set('data', data);

        // Must schedule for afterRender as createChart depends on existence of component's element
        Ember.run.scheduleOnce('afterRender', this, this.get('createChart'));
    },

    init() {
        this._super(...arguments);
        this.setupResize();
    },

    willDestroyElement() {
        this._super(...arguments);
        this.tearDownResize();
        this.cancelTimers();
    }
});
