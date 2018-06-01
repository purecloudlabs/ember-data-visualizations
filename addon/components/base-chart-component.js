import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { bind, debounce, cancel, scheduleOnce } from '@ember/runloop';
import _ from 'lodash/lodash';
import dc from 'dc';

export default Component.extend({
    resizeDetector: service(),

    classNames: ['chart'],

    instantRun: false,
    resizeTimer: null,
    onResizeDebounced: null,
    isChartAvailable: true,
    chartNotAvailableMessage: null,
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
        svg.call(tip);

        // clicking actions
        this.get('chart').selectAll('rect.bar').on('click', d => {
            this.onClick(d);
        });

        this.get('chart').selectAll('rect')
            .on('mouseover', tip.show)
            .on('mouseout', tip.hide);
    },

    onClick() {},

    buildChart() {},

    showChartNotAvailable() {},

    createTooltip() {},

    createChart() {
        this.cleanupCurrentChart();

        if (!this.get('isChartAvailable')) {
            this.showChartNotAvailable();
            return;
        }

        // NOTE: THIS BEING HERE IS ASSUMING ALL CHARTS WILL USE ALL OF THESE PROPERTIES. MAY NOT BE A VALID ASSUMPTION
        // REQUIRED: group, dimension, xAxis.domain unless !isChartAvailable
        if (!this.get('group') || !this.get('group.0.all') || !this.get('dimension')) {
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

        if (this.$() && this.$().parents() && !_.isEmpty(this.$().parents().find('.d3-tip'))) {
            this.$().parents().find('.d3-tip').remove();
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

        scheduleOnce('afterRender', this, this.setupResize);

        if (this.get('chart')) {
            dc.redrawAll();
        }
    }
});
