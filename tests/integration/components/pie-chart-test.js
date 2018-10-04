import Service from '@ember/service';
import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';
import crossfilter from 'crossfilter';
import wait from 'ember-test-helpers/wait';
import { later } from '@ember/runloop';

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

moduleForComponent('pie-chart', 'Integration | Component | pie chart', {
    integration: true,
    beforeEach() {
        this.set('params', getTestParameters());
        this.register('service:resizeDetector', Service.extend({
            setup(elementId, callback) {
                callback();
            },
            teardown() { }
        }));
    }
});

test('it renders', function (assert) {
    this.render(hbs`{{pie-chart}}`);
    assert.dom('.chart.pie-chart').exists();
});

test('it renders a slice for each data point', function (assert) {
    this.render(hbs`{{pie-chart dimension=params.dimensions group=params.groups instantRun=true}}`);
    assert.dom('g.pie-slice').exists({ count: 4 });
});

test('it can render a label for each data point', function (assert) {
    this.render(hbs`{{pie-chart dimension=params.dimensions group=params.groups labels=true instantRun=true}}`);
    later(this, () => assert.dom('text.pie-label').exists({ count: 4 }), 1000);
    return wait();
});

test('it shows chart not available', function (assert) {
    this.render(hbs`{{pie-chart isChartAvailable=false instantRun=true}}`);
    // delayed to let all dc rendering processes finish
    later(this, () => assert.dom('.chart-not-available').exists(), 1000);
    return wait();
});

test('it renders a legend with the correct number of boxes', function (assert) {
    this.render(hbs`{{pie-chart dimension=params.dimensions group=params.groups showLegend=true instantRun=true}}`);
    later(this, () => assert.dom('g.legend > g.legendItem').exists({ count: 4 }), 1000);
    return wait();
});

test('it can show a total', function (assert) {
    this.render(hbs`{{pie-chart dimension=params.dimensions group=params.groups showTotal=true instantRun=true}}`);
    later(this, () => assert.dom('text.totalText').exists(), 1000);
    return wait();
});
