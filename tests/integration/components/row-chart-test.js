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

moduleForComponent('row-chart', 'Integration | Component | row chart', {
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
    this.render(hbs`{{row-chart}}`);
    assert.dom('.chart.row-chart').exists();
});

test('it renders correct number of x axis ticks', function (assert) {
    this.render(hbs`{{row-chart dimension=params.dimensions group=params.groups xAxis=params.xAxis instantRun=true}}`);
    assert.dom('g.axis.x g.tick').exists({ count: 3 });
});

test('it renders a bar for each data point', function (assert) {
    this.render(hbs`{{row-chart dimension=params.dimensions group=params.groups xAxis=params.xAxis instantRun=true}}`);
    assert.dom('g.row rect').exists({ count: 4 });
});

test('it renders a label for each data point', function (assert) {
    this.render(hbs`{{row-chart dimension=params.dimensions group=params.groups xAxis=params.xAxis instantRun=true}}`);
    later(this, () => assert.dom('g.axis.y g.tick text').exists({ count: 4 }), 1000);
    return wait();
});

test('it shows chart not available', function (assert) {
    this.render(hbs`{{row-chart isChartAvailable=false chartNotAvailableBars=4 xAxis=params.xAxis instantRun=true}}`);
    // delayed to let all dc rendering processes finish
    later(this, () => assert.dom('.chart-not-available').exists(), 1000);
    return wait();
});

test('it renders minimum and maximum value indicators', function (assert) {
    this.render(hbs`{{row-chart showMaxMin=true dimension=params.dimensions group=params.groups xAxis=params.xAxis instantRun=true}}`);

    const runAssertions = () => {
        assert.dom('.max-value-text').exists();
        assert.dom('.max-value-indicator').exists();
        assert.dom('.min-value-text').exists();
        assert.dom('.min-value-indicator').exists();
    };

    // delayed to let all dc rendering processes finish
    later(this, runAssertions, 1000);
    return wait();
});

test('it can hide x tick lines correctly', function (assert) {
    this.render(hbs`{{row-chart dimension=params.dimensions group=params.groups xAxis=params.xAxis  hideXAxisLines=true instantRun=true}}`);
    // delayed to let all dc rendering processes finish
    later(this, () => assert.dom('g.axis.x g.tick line.grid-line').exists(), 1000);
    return wait();
});
test('it can render y ticks correctly', function (assert) {
    this.render(hbs`{{row-chart dimension=params.dimensions group=params.groups xAxis=params.xAxis  showYTicks=true instantRun=true}}`);
    // delayed to let all dc rendering processes finish
    later(this, () => assert.dom('line.yTick').exists({ count: 4 }), 1000);
    return wait();
});
test('it can render y grid lines correctly', function (assert) {
    this.render(hbs`{{row-chart dimension=params.dimensions group=params.groups xAxis=params.xAxis  showYGridLines=true instantRun=true}}`);
    // delayed to let all dc rendering processes finish
    later(this, () => assert.dom('line.y.grid-line').exists({ count: 4 }), 1000);
    return wait();
});
test('it can render both y ticks and y grid lines correctly', function (assert) {
    this.render(hbs`{{row-chart dimension=params.dimensions group=params.groups xAxis=params.xAxis  showYGridLines=true showYTicks=true instantRun=true}}`);

    const runAssertions = () => {
        assert.dom('line.y.grid-line').exists({ count: 4 });
        assert.dom('line.yTick').exists({ count: 4 });
    };

    // delayed to let all dc rendering processes finish
    later(this, runAssertions, 1000);
    return wait();
});

test('it shows a comparison line', function (assert) {
    this.render(hbs`{{row-chart showComparisonLine=true comparisonLine=params.comparisonLine dimension=params.dimensions group=params.groups xAxis=params.xAxis instantRun=true}}`);
    // delayed to let all dc rendering processes finish
    later(this, () => assert.dom('.comparison-line').exists({ count: 3 }), 1000);
    return wait();
});

test('it renders a legend with the correct number of boxes', function (assert) {
    this.render(hbs`{{row-chart showLegend=true dimension=params.dimensions group=params.groups xAxis=params.xAxis instantRun=true}}`);
    // delayed to let all dc rendering processes finish
    later(this, () => assert.dom('g.legend > g.legendItem').exists({ count: 4 }), 1000);
    return wait();
});
