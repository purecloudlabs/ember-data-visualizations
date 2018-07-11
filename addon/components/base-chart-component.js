import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { bind, debounce, cancel, scheduleOnce } from '@ember/runloop';
import _ from 'lodash/lodash';
import d3 from 'd3';

export default Component.extend({
    resizeDetector: service(),

    classNames: ['chart'],

    colors: [
        '#1f77b4', '#ff7f0e', '#2ca02c',
        '#9467bd', '#8c564b', '#e377c2',
        '#7f7f7f', '#bcbd22', '#17becf'
    ],

    instantRun: false,
    resizeTimer: null,
    onResizeDebounced: null,
    isChartAvailable: true,
    chartNotAvailableMessage: 'Chart is not available for this view',
    chartNotAvailableTextColor: '#888888',
    chartNotAvailableColor: '#b3b3b3',
    tooltipDateFormat: 'll LT',
    group: null,
    dimension: null,
    seriesData: null,
    data: null,
    series: [],
    height: 200,
    xAxis: {},
    yAxis: {},

    setupResize() {
        this.set('onResizeDebounced', () => {
            // This is outside the Ember run loop so check if component is destroyed
            if (this.get('isDestroyed') || this.get('isDestroying')) {
                return;
            }
            this.set('resizeTimer', debounce(this, this.createChart, 400, this.get('instantRun')));
        });

        this.set('callback', bind(this, this.onResizeDebounced));
        this.get('resizeDetector').setup(`#${this.get('elementId')}`, this.get('callback'));
    },

    tearDownResize() {
        this.get('resizeDetector').teardown(`#${this.get('elementId')}`, this.get('callback'));
    },

    cancelTimers() {
        cancel(this.get('resizeTimer'));
    },

    addClickHandlersAndTooltips(svg, tip, elementToApplyTip) {
        if (tip && !svg.empty()) {
            svg.call(tip);
        }
        // clicking actions
        this.get('chart').selectAll(elementToApplyTip).on('click', d => {
            this.onClick(d);
        });

        this.get('chart').selectAll(elementToApplyTip)
            .on('mouseover.tip', tip.show)
            .on('mouseout.tip', tip.hide);
    },

    addLegend(chart, chartElement, legendG, legendDimension) {
        const colorMap = this.get('colorMap');
        const colors = this.get('colors');

        legendG.attr('class', 'legend');
        let legendGs = legendG.selectAll('g')
            .data(colorMap)
            .enter().append('g')
            .attr('class', 'legendItem');
        legendGs.append('rect')
            .attr('class', 'legendRect')
            .attr('y', (d, i) => (i + 1) * 22)
            .attr('height', legendDimension)
            .attr('width', legendDimension)
            .attr('fill', (d, i) => colors[i])
            .on('click', legendClickHandler);
        legendGs.append('text')
            .attr('unselectable', 'on')
            .attr('x', legendDimension + 6)
            .attr('y', (d, i) => (i + 1) * 22 + (legendDimension * 0.75))
            .text(d => d);

        function legendClickHandler() {
            const all = chart.selectAll(`rect.legendRect,${chartElement}`);

            const clicked = all.filter(d => {
                let color = d.value || d;
                return colors[colorMap.indexOf(color)] == d3.select(this).attr('fill');
            });

            const allOthers = all.filter(d => {
                let color = d.value || d;
                return colors[colorMap.indexOf(color)] !== d3.select(this).attr('fill');
            });

            // determine if any other groups are selected
            let isAnyLegendRectSelected = false;
            allOthers.each(function () {
                if (d3.select(this).classed('selected')) {
                    isAnyLegendRectSelected = true;
                }
            });

            // helper functions
            function toggleSelection(element) {
                element.classed('selected', !element.classed('selected'));
                element.classed('deselected', !element.classed('deselected'));
            }

            function returnToNeutral(element) {
                element.classed('selected', false);
                element.classed('deselected', false);
            }

            // class the groups based on what is currently selected and what was clicked
            if (clicked.classed('selected')) {
                if (isAnyLegendRectSelected) {
                    toggleSelection(clicked);
                } else {
                    returnToNeutral(all);
                }
            } else if (clicked.classed('deselected')) {
                toggleSelection(clicked);
            } else {
                clicked.classed('selected', true);
                allOthers.classed('deselected', true);
            }
        }
    },

    onClick() {},

    buildChart() { },

    showChartNotAvailable() { },

    createTooltip() { },

    createChart() {
        this.cleanupCurrentChart();

        if (!this.get('isChartAvailable')) {
            this.showChartNotAvailable();
            return;
        }

        // REQUIRED: group, dimension unless !isChartAvailable
        if (!this.get('group') || !this.get('dimension')) {
            return false;
        }

        this.buildChart();

        this.get('chart').render();
    },

    cleanupCurrentChart() {
        if (this.get('chart')) {
            this.get('chart')
                .on('renderlet', null)
                .on('postRender', null);
        }

        if (this.$() && this.$().parents() && !_.isEmpty(this.$().parents().find(`.d3-tip#${this.get('elementId')}`))) {
            this.$().parents().find(`.d3-tip#${this.get('elementId')}`).remove();
        }
    },

    willDestroyElement() {
        this._super(...arguments);
        this.tearDownResize();
        this.cancelTimers();
    },

    didReceiveAttrs() {
        this._super(...arguments);
        let data = {};
        if (Array.isArray(this.get('group'))) {
            _.forEach(this.get('group'), g => {
                _.forEach(g.all(), datum => {
                    if (data[datum.key]) {
                        data[datum.key].push(datum.value);
                    } else {
                        data[datum.key] = [datum.value];
                    }
                });
            });
        } else if (this.get('group')) {
            data.total = 0;
            _.forEach(this.get('group').all(), datum => {
                if (data[datum.key]) {
                    data[datum.key].push(datum.value);
                    data.total += datum.value;
                } else {
                    data[datum.key] = [datum.value];
                    data.total += datum.value;
                }
            });
        }
        this.set('data', data);

        scheduleOnce('afterRender', this, this.setupResize);

        if (this.get('chart')) {
            this.get('chart').redraw();
        }
    }
});
