import Service from '@ember/service';
import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';
import crossfilter from 'crossfilter';
import wait from 'ember-test-helpers/wait';
import { later } from '@ember/runloop';

const getTestParameters = function () {
    const rawData
    = [{ 'fruit': 'blueberries', 'radius': 40, 'description': 'delicious' },
        { 'fruit': 'oranges', 'radius': 30, 'description': 'ew' },
        { 'fruit': 'apples', 'radius': 10, 'description': 'tasty' },
        { 'fruit': 'strawberries', 'radius': 50, 'description': 'no good' }];

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

moduleForComponent('bubble-chart', 'Integration | Component | bubble chart', {
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
    this.render(hbs`{{bubble-chart}}`);
    assert.equal(this.$('.chart.bubble-chart').length, 1);
});

test('it renders a bubble for each data point', function (assert) {
    this.render(hbs`{{bubble-chart dimension=params.dimension group=params.group instantRun=true}}`);
    assert.equal(this.$('circle.bubble').length, 4);
});

test('it renders a title for each data point', function (assert) {
    this.render(hbs`{{bubble-chart dimension=params.dimension group=params.group instantRun=true}}`);
    later(this, (() => assert.equal(this.$('text.title').length, 4)), 1000);
    return wait();
});

test('it renders a subtitle for each data point', function (assert) {
    this.render(hbs`{{bubble-chart dimension=params.dimension group=params.group instantRun=true}}`);
    later(this, (() => assert.equal(this.$('text.subtitle').length, 4)), 1000);
    return wait();
});

test('it shows chart not available', function (assert) {
    this.render(hbs`{{bubble-chart isChartAvailable=false instantRun=true}}`);
    // delayed to let all dc rendering processes finish
    later(this, (() => assert.equal(this.$('.chart-not-available').length, 1)), 1000);
    return wait();
});