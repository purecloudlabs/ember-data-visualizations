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
    const groups = [dimensions.group()];

    return {
        dimensions,
        groups,
        xAxis: {
            ticks: 3
        },
        comparisonLine: {
            value: 15,
            displayValue: '15',
            color: '#2CD02C'
        }
    };
};

module('Integration | Component | row chart', function (hooks) {
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
        await render(hbs`{{row-chart}}`);
        assert.dom('.chart.row-chart').exists();
    });

    test('it renders correct number of x axis ticks', async function (assert) {
        await render(hbs`{{row-chart dimension=params.dimensions group=params.groups xAxis=params.xAxis instantRun=true}}`);
        assert.dom('g.axis.x g.tick').exists({ count: 3 });
    });

    test('it renders a bar for each data point', async function (assert) {
        await render(hbs`{{row-chart dimension=params.dimensions group=params.groups xAxis=params.xAxis instantRun=true}}`);
        assert.dom('g.row rect').exists({ count: 4 });
    });

    test('it renders a label for each data point', async function (assert) {
        await render(hbs`{{row-chart dimension=params.dimensions group=params.groups xAxis=params.xAxis instantRun=true}}`);
        assert.dom('g.axis.y g.tick text').exists({ count: 4 });
    });

    test('it shows chart not available', async function (assert) {
        await render(hbs`{{row-chart isChartAvailable=false chartNotAvailableBars=4 xAxis=params.xAxis instantRun=true}}`);
        assert.dom('.chart-not-available').exists();
    });

    test('it renders minimum and maximum value indicators', async function (assert) {
        await render(hbs`{{row-chart showMaxMin=true dimension=params.dimensions group=params.groups xAxis=params.xAxis instantRun=true}}`);
        assert.dom('.max-value-text').exists();
        assert.dom('.max-value-indicator').exists();
        assert.dom('.min-value-text').exists();
        assert.dom('.min-value-indicator').exists();
    });

    test('it can hide x tick lines correctly', async function (assert) {
        await render(hbs`{{row-chart dimension=params.dimensions group=params.groups xAxis=params.xAxis  hideXAxisLines=true instantRun=true}}`);
        assert.dom('g.axis.x g.tick line.grid-line').exists();
    });
    test('it can render y ticks correctly', async function (assert) {
        await render(hbs`{{row-chart dimension=params.dimensions group=params.groups xAxis=params.xAxis  showYTicks=true instantRun=true}}`);
        assert.dom('line.yTick').exists({ count: 4 });
    });
    test('it can render y grid lines correctly', async function (assert) {
        await render(hbs`{{row-chart dimension=params.dimensions group=params.groups xAxis=params.xAxis  showYGridLines=true instantRun=true}}`);
        assert.dom('line.y.grid-line').exists({ count: 4 });
    });
    test('it can render both y ticks and y grid lines correctly', async function (assert) {
        await render(hbs`{{row-chart dimension=params.dimensions group=params.groups xAxis=params.xAxis  showYGridLines=true showYTicks=true instantRun=true}}`);

        assert.dom('line.y.grid-line').exists({ count: 4 });
        assert.dom('line.yTick').exists({ count: 4 });
    });

    test('it shows a comparison line', async function (assert) {
        await render(hbs`{{row-chart showComparisonLine=true comparisonLine=params.comparisonLine dimension=params.dimensions group=params.groups xAxis=params.xAxis instantRun=true}}`);
        assert.dom('.comparison-line').exists({ count: 3 });
    });

    test('it renders a legend with the correct number of boxes', async function (assert) {
        await render(hbs`{{row-chart showLegend=true dimension=params.dimensions group=params.groups xAxis=params.xAxis instantRun=true}}`);
        assert.dom('.legend-container > .legend-item').exists({ count: 4 });
    });
});
