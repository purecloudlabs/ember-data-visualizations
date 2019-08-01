import Service from '@ember/service';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import crossfilter from 'crossfilter';
import moment from 'moment';

const getTestParameters = function () {
    const rawData = [
        { date: new Date('2016-11-02'), queue: 'Service', value: 0.7 },
        { date: new Date('2016-11-02'), queue: 'IT', value: 0.8 },
        { date: new Date('2016-11-02'), queue: 'Manufacturing', value: 0.3 },
        { date: new Date('2016-11-03'), queue: 'Service', value: 0.4 },
        { date: new Date('2016-11-03'), queue: 'IT', value: 0.9 },
        { date: new Date('2016-11-03'), queue: 'Manufacturing', value: 0.7 },
        { date: new Date('2016-11-04'), queue: 'Service', value: 0.7 },
        { date: new Date('2016-11-04'), queue: 'IT', value: 0.9 },
        { date: new Date('2016-11-04'), queue: 'Manufacturing', value: 0.4 }
    ];

    const crossfilterData = crossfilter(rawData);
    const dimension = crossfilterData.dimension(d => [d.queue, d.date]);

    let group = dimension.group().reduce(
        (p, v) => {
            return v.value;
        },
        () => { },
        () => ({})
    );

    return {
        dimension,
        group,
        xAxis: {
            domain: [
                moment('2016-11-01'),
                moment('2016-11-05')
            ],
            ticks: 3
        },

        yAxis: {
            ticks: 3
        },

        colorMap: d => d,
        keyFormat: key => moment(key.toString()).format('MMM DD')
    };
};

module('Integration | Component | heat map', function (hooks) {
    setupRenderingTest(hooks);

    hooks.beforeEach(function () {
        this.set('params', getTestParameters());
        this.owner.register('service:resizeDetector', Service.extend({
            setup(elementId, callback) {
                callback();
            },
            teardown() { }
        }));
    });

    test('it renders', async function (assert) {
        await render(hbs`{{heat-map}}`);
        assert.dom('.chart.heat-map').exists();
    });

    test('it renders a rectangle for each data point', async function (assert) {
        await render(hbs`{{heat-map dimension=params.dimension group=params.group xAxis=params.xAxis yAxis=params.yAxis colorMap=params.colorMap keyFormat=params.keyFormat instantRun=true}}`);
        assert.dom('rect.heat-box').exists({ count: 9 });
    });

    test('it renders correct number of x axis ticks', async function (assert) {
        await render(hbs`{{heat-map dimension=params.dimension group=params.group xAxis=params.xAxis yAxis=params.yAxis colorMap=params.colorMap keyFormat=params.keyFormat instantRun=true}}`);
        assert.dom('.tickMark').exists({ count: 3 });
    });

    test('it renders a legend with the correct number of boxes', async function (assert) {
        await render(hbs`{{heat-map dimension=params.dimension group=params.group xAxis=params.xAxis yAxis=params.yAxis colorMap=params.colorMap keyFormat=params.keyFormat instantRun=true}}`);
        assert.dom('.legend-container > .legend-item').exists({ count: 5 });
    });

    test('it shows chart not available', async function (assert) {
        await render(hbs`{{heat-map isChartAvailable=false xAxis=params.xAxis keyFormat=params.keyFormat instantRun=true}}`);
        assert.dom('.chart-not-available').exists();
    });
});
