import Service from '@ember/service';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import crossfilter from 'crossfilter';
import { later } from '@ember/runloop';

const getTestParameters = function () {
    const rawData = [
        { 'fruit': 'blueberries', 'radius': 40, 'description': 'delicious' },
        { 'fruit': 'oranges', 'radius': 30, 'description': 'ew' },
        { 'fruit': 'apples', 'radius': 10, 'description': 'tasty' },
        { 'fruit': 'strawberries', 'radius': 50, 'description': 'no good' }
    ];

    const crossfilterData = crossfilter(rawData);
    const dimension = crossfilterData.dimension(d => d.fruit);

    let group = dimension.group().reduce(
        (p, v) => {
            p.radius = v.radius;
            p.subtitle = v.description;
            p.tooltip = v.fruit;
            return p;
        },
        () => { },
        () => ({})
    );

    return {
        dimension,
        group
    };
};

module('Integration | Component | bubble chart', function (hooks) {
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
        await render(hbs`{{bubble-chart}}`);
        assert.dom('.chart.bubble-chart').exists();
    });

    test('it renders a bubble for each data point', async function (assert) {
        await render(hbs`{{bubble-chart dimension=params.dimension group=params.group instantRun=true}}`);
        assert.dom('circle.bubble').exists({ count: 4 });
    });

    test('it renders a title for each data point', async function (assert) {
        await render(hbs`{{bubble-chart dimension=params.dimension group=params.group instantRun=true}}`);
        later(this, () => assert.dom('text.title').exists({ count: 4 }), 1000);
    });

    test('it renders a subtitle for each data point', async function (assert) {
        await render(hbs`{{bubble-chart dimension=params.dimension group=params.group instantRun=true}}`);
        later(this, () => assert.dom('text.subtitle').exists({ count: 4 }), 1000);
    });

    test('it renders a legend with the correct number of boxes', async function (assert) {
        await render(hbs`{{bubble-chart showLegend=true dimension=params.dimension group=params.group instantRun=true}}`);
        later(this, () => assert.dom('.legend-container > .legend-item').exists({ count: 4 }), 1000);
    });

    test('it shows chart not available', async function (assert) {
        await render(hbs`{{bubble-chart isChartAvailable=false instantRun=true}}`);
        assert.dom('.chart-not-available').exists();
    });
});
