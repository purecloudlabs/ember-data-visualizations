import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { bind, debounce, cancel, scheduleOnce } from '@ember/runloop';
import { computed } from '@ember/object';
import { A } from '@ember/array';
import d3 from 'd3';
import ChartSizes from 'ember-data-visualizations/utils/chart-sizes';
import dc from 'dc';

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
    chartNotAvailableMessage: 'Chart not available for this view',
    chartNotAvailableTextColor: '#888888',
    chartNotAvailableColor: '#b3b3b3',
    tooltipDateFormat: 'll LT',
    group: null,
    dimension: null,
    data: null,
    height: 200,
    xAxis: {},
    yAxis: {},
    AlertType: {
        ABOVE: 'above',
        BELOW: 'below'
    },

    uniqueChartGroupName: computed('elementId', function () {
        return `chart-group-${this.get('elementId')}`;
    }),

    /**
       @desc Retrieves the color at the given index. Just returns the last available color if index is out of bounds of the array.
       @param {number} index
       @returns {string} Hex color string
    */
    getColorAtIndex(index) {
        const colors = this.get('colors');
        return colors[index] || colors[colors.length - 1];
    },

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
            .on('mouseover.tip', function (d) {
                tip.show(d, this);
            })
            .on('mouseout.tip', function (d) {
                tip.hide(d, this);
            });
    },

    addLegend(chart, legendables, legendG, legendDimension, legendWidth) {
        legendG.attr('class', 'legend');

        const legendContainer = legendG
            .append('foreignObject')
            .attr('class', 'legend-embed')
            .attr('height', chart.height())
            .attr('width', legendWidth || ChartSizes.LEGEND_WIDTH)
            .append('xhtml:div')
            .attr('class', 'legend-container')
            .attr('xmlns', 'http://www.w3.org/1999/xhtml');

        const legendItems = legendContainer
            .selectAll('g')
            .data(legendables)
            .enter()
            .append('div')
            .attr('class', 'legend-item');

        legendItems
            .append('span')
            .attr('class', 'legend-box')
            .attr('style', d => `height: ${legendDimension}px; width: ${legendDimension}px; background-color: ${d.color}`)
            .on('click', legendClickHandler);

        legendItems
            .append('span')
            .attr('class', 'legend-text')
            .text(d => d.title);

        function legendClickHandler(d) {
            const clicked = d3.select(this);
            const clickedElements = d.elements;
            const allOthers = chart.selectAll('span.legend-box').filter(legendD => legendD.color !== d.color);
            let allOtherElements = [];
            for (let i = 0; i < legendables.length; i++) {
                if (legendables[i].color !== d.color) {
                    allOtherElements.push(legendables[i].elements);
                }
            }

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
                    toggleSelection(clickedElements);
                } else {
                    returnToNeutral(clicked);
                    returnToNeutral(clickedElements);
                    returnToNeutral(allOthers);
                    for (let i = 0; i < allOtherElements.length; i++) {
                        returnToNeutral(allOtherElements[i]);
                    }
                }
            } else if (clicked.classed('deselected')) {
                toggleSelection(clicked);
                toggleSelection(clickedElements);
            } else {
                clicked.classed('selected', true);
                clickedElements.classed('selected', true);
                allOthers.classed('deselected', true);
                for (let i = 0; i < allOtherElements.length; i++) {
                    allOtherElements[i].classed('deselected', true);
                }
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

        let tooltips = document.querySelector(`.d3-tip#${this.get('elementId')}`);
        if (tooltips) {
            tooltips.remove();
        }
    },

    willDestroyElement() {
        this._super(...arguments);
        this.tearDownResize();
        this.cancelTimers();
        dc.chartRegistry.clear(this.get('uniqueChartGroupName'));
    },

    didReceiveAttrs() {
        this._super(...arguments);
        let data = {};
        if (Array.isArray(this.get('group'))) {
            A(this.get('group')).forEach(g => {
                A(g.all()).forEach(datum => {
                    if (data[datum.key]) {
                        data[datum.key].push(datum.value);
                    } else {
                        data[datum.key] = [datum.value];
                    }
                });
            });
        } else if (this.get('group')) {
            data.total = 0;
            A(this.get('group').all()).forEach(datum => {
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
