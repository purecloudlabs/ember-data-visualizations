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
    assert.equal(this.$('.chart.row-chart').length, 1);
});

test('it renders correct number of x axis ticks', function (assert) {
    this.render(hbs`{{row-chart dimension=params.dimensions group=params.groups xAxis=params.xAxis instantRun=true}}`);
    assert.equal(this.$('g.axis g.tick').length, 3);
});

test('it renders a bar for each data point', function (assert) {
    this.render(hbs`{{row-chart dimension=params.dimensions group=params.groups xAxis=params.xAxis instantRun=true}}`);
    assert.equal(this.$('g.row rect').length, 4);
});

test('it renders a label for each data point', function (assert) {
    this.render(hbs`{{row-chart dimension=params.dimensions group=params.groups xAxis=params.xAxis instantRun=true}}`);
    later(this, (() => assert.equal(this.$('g.row g.tick text').length, 4)), 1000);
    return wait();
});

test('it shows chart not available', function (assert) {
    this.render(hbs`{{row-chart isChartAvailable=false chartNotAvailableBars=4 xAxis=params.xAxis instantRun=true}}`);
    // delayed to let all dc rendering processes finish
    later(this, (() => assert.equal(this.$('.chart-not-available').length, 1)), 1000);
    return wait();
});

test('it renders minimum and maximum value indicators', function (assert) {
    this.render(hbs`{{row-chart showMaxMin=true dimension=params.dimensions group=params.groups xAxis=params.xAxis instantRun=true}}`);

    const runAssertions = () => {
        assert.equal(this.$('.max-value-text').length, 1);
        assert.equal(this.$('.max-value-indicator').length, 1);
        assert.equal(this.$('.min-value-text').length, 1);
        assert.equal(this.$('.min-value-indicator').length, 1);
    };

    // delayed to let all dc rendering processes finish
    later(this, runAssertions, 1000);
    return wait();
});

test('it can hide x tick lines correctly', function (assert) {
    this.render(hbs`{{row-chart dimension=params.dimensions group=params.groups xAxis=params.xAxis  hideXAxisLines=true instantRun=true}}`);
    // delayed to let all dc rendering processes finish
    later(this, (() => assert.equal(this.$('g.axis g.tick line.grid-line').length, 1)), 1000);
    return wait();
});
test('it can render y ticks correctly', function (assert) {
    this.render(hbs`{{row-chart dimension=params.dimensions group=params.groups xAxis=params.xAxis  showYTicks=true instantRun=true}}`);
    // delayed to let all dc rendering processes finish
    later(this, (() => assert.equal(this.$('path.yTick').length, 4)), 1000);
    return wait();
});
test('it can render y grid lines correctly', function (assert) {
    this.render(hbs`{{row-chart dimension=params.dimensions group=params.groups xAxis=params.xAxis  showYGridLines=true instantRun=true}}`);
    // delayed to let all dc rendering processes finish
    later(this, (() => assert.equal(this.$('path.yGridLine').length, 4)), 1000);
    return wait();
});
test('it can render both y ticks and y grid lines correctly', function (assert) {
    this.render(hbs`{{row-chart dimension=params.dimensions group=params.groups xAxis=params.xAxis  showYGridLines=true showYTicks=true instantRun=true}}`);

    const runAssertions = () => {
        assert.equal(this.$('path.yGridLine').length, 4);
        assert.equal(this.$('path.yTick').length, 4);
    };

    // delayed to let all dc rendering processes finish
    later(this, runAssertions, 1000);
    return wait();
});

test('it shows a comparison line', function (assert) {
    this.render(hbs`{{row-chart showComparisonLine=true comparisonLine=params.comparisonLine dimension=params.dimensions group=params.groups xAxis=params.xAxis instantRun=true}}`);
    // delayed to let all dc rendering processes finish
    later(this, (() => assert.equal(this.$('.comparison-line').length, 3)), 1000);
    return wait();
});

