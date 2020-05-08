/* eslint-disable indent */

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

    addClickHandlersAndTooltips(svg, tip) {
        if (tip && !svg.empty()) {
            svg.call(tip);
        }
        // clicking actions
        this.get('chart').selectAll(this.elementToApplyTipSelector).on('click', d => {
            this.onClick(d);
        });

        // when user navigates using tab key and uses enter button to drill-in the chart
        const onClick = this.onClick;
        this.get('chart').selectAll(this.elementToApplyTipSelector).each(function () {
            const bar = d3.select(this);
            this.addEventListener('keydown', function (e) {
                if (e.keyCode == '13') {
                    onClick(bar.datum());
                }
            });
        });

        this.get('chart').selectAll(this.elementToApplyTipSelector)
            .on('mouseover.tip', function (d) {
                tip.show(d, this);
            })
            .on('mouseout.tip', function (d) {
                tip.hide(d, this);
            });
    },

    removeClickHandlersAndTooltips() {
        // clicking actions
        this.get('chart').selectAll(this.elementToApplyTipSelector).on('click', null);

        this.get('chart').selectAll(this.elementToApplyTipSelector)
            .on('mouseover.tip', null)
            .on('mouseout.tip', null);
    },

    legendClickHandler(d, chart, legendables) {
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
            .on('click', function (d) {
                return this.legendClickHandler.call(this, d, chart, legendables);
            });

        legendItems
            .append('span')
            .attr('class', 'legend-text')
            .text(d => d.title);
    },

    addLowerLegend(chart, legendables, legendG, options) {
        const legendHeight = options && options.height || ChartSizes.LEGEND_HEIGHT;
        const legendFontSize = options && options.fontSize || ChartSizes.LEGEND_FONTSIZE;

        const legendClickHandler = this.legendClickHandler;

        const margins = chart.margins();
        legendG.select('foreignObject').remove();

        const legend = legendG.append('svg:foreignObject')
            .attr('class', 'legend-embed')
            .attr('height', legendHeight)
            .attr('width', chart.width() - margins.left - margins.right)
            .attr('transform', `translate(${margins.left})`)
            .attr('style', 'overflow-y: auto;');

        const legendItems = legend
            .append('xhtml:div')
                .attr('class', 'legend-container')
                .attr('style', 'height: 100%; width: 100%;')
                .attr('xmlns', 'http://www.w3.org/1999/xhtml')
            .append('xhtml:div')
                .attr('class', 'legend-container')
                .attr('style', 'height: 100%; width: 100%;')
                .attr('xmlns', 'http://www.w3.org/1999/xhtml')
            .selectAll('g')
                .data(legendables)
                .enter()
            .append('div')
                .attr('class', 'legend-item')
                .attr('style', () => {
                    return 'display: inline-flex; margin-right: 5px;';
                });

        // legend item colors
        legendItems
            .append('span')
            .attr('class', 'legend-box')
            .attr('style', d => {
                return `
                    width: ${legendFontSize}px;
                    height: ${legendFontSize}px;
                    border: 1px solid black;
                    display: inline-block;
                    background-color: ${d.color};
                    margin-right: 3px;
                `;
            })
            .on('click', function (d) {
                return legendClickHandler.call(this, d, chart, legendables);
            });

        // legend item text
        legendItems
            .append('span')
            .attr('class', 'legend-text')
            .attr('style', `font-size: ${legendFontSize}px;`)
            .text(d => d.title);
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
            this.removeClickHandlersAndTooltips(this.elementToApplyTipSelector);
            this.get('chart')
                .on('renderlet', null)
                .on('postRender', null);
        }
        let tooltips = document.querySelectorAll(`.d3-tip.${this.get('elementId')}`);
        if (tooltips && tooltips.length) {
            tooltips.forEach(tooltip => {
                tooltip.remove();
            });
        }
    },

    willDestroyElement() {
        this._super(...arguments);
        this.cleanupCurrentChart();
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
