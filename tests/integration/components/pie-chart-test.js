import Service from '@ember/service';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import crossfilter from 'crossfilter';

const getTestParameters = function () {
    const rawData = [{ 'fruit': 'blueberries' },
        { 'fruit': 'blueberries' },
        { 'fruit': 'oranges' },
        { 'fruit': 'apples' },
        { 'fruit': 'apples' },
        { 'fruit': 'blueberries' },
        { 'fruit': 'strawberries' },
        { 'fruit': 'strawberries' },
        { 'fruit': 'blueberries' },
        { 'fruit': 'blueberries' }];

    const crossfilterData = crossfilter(rawData);
    const dimensions = crossfilterData.dimension(d => d.fruit);
    const groups = dimensions.group();

    return {
        dimensions,
        groups,
        xAxis: {
            ticks: 3
        }
    };
};

module('Integration | Component | pie chart', function (hooks) {
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
        await render(hbs`{{pie-chart}}`);
        assert.dom('.chart.pie-chart').exists();
    });

    test('it renders a slice for each data point', async function (assert) {
        await render(hbs`{{pie-chart dimension=params.dimensions group=params.groups instantRun=true}}`);
        assert.dom('g.pie-slice').exists({ count: 4 });
    });

    test('it can render a label for each data point', async function (assert) {
        await render(hbs`{{pie-chart dimension=params.dimensions group=params.groups labels=true instantRun=true}}`);
        assert.dom('text.pie-label').exists({ count: 4 });
    });

    test('it shows chart not available', async function (assert) {
        await render(hbs`{{pie-chart isChartAvailable=false instantRun=true}}`);
        assert.dom('.chart-not-available').exists();
    });

    test('it renders a legend with the correct number of boxes', async function (assert) {
        await render(hbs`{{pie-chart dimension=params.dimensions group=params.groups showLegend=true instantRun=true}}`);
        assert.dom('.legend-container > .legend-item').exists({ count: 4 });
    });

    test('it can show a total', async function (assert) {
        await render(hbs`{{pie-chart dimension=params.dimensions group=params.groups showTotal=true instantRun=true}}`);
        assert.dom('text.totalText').exists();
    });
});
