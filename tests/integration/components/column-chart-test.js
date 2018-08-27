import Service from '@ember/service';
import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';
import moment from 'moment';
import crossfilter from 'crossfilter';
import wait from 'ember-test-helpers/wait';
import { later } from '@ember/runloop';

const getTestParameters = function () {
    const groupNames = ['fruits', 'citrus', 'oranges'];
    const rawData = [
        {
            date: new Date('2016-11-02'),
            fruits: 42,
            citrus: 20,
            oranges: 8
        },
        {
            date: new Date('2016-11-03'),
            fruits: 38,
            citrus: 33,
            oranges: 12
        },
        {
            date: new Date('2016-11-04'),
            fruits: 52,
            citrus: 52,
            oranges: 25
        }
    ];

    const crossfilterData = crossfilter(rawData);
    const dimensions = crossfilterData.dimension(d => d.date);
    const groups = groupNames.map(name => dimensions.group().reduceSum(item => item[name]));

    return {
        dimensions,
        groups,
        type: 'LAYERED',

        series: [
            {
                title: 'Total Fruit Eaten',
                hatch: 'pos'
            },
            {
                title: 'Citrus Fruit Eaten',
                hatch: 'neg'
            },
            {
                title: 'Oranges Eaten'
            }
        ],

        xAxis: {
            domain: [
                moment('2016-11-01'),
                moment('2016-11-05')
            ],
            ticks: 5
        },

        yAxis: {
            ticks: 3
        },

        comparisonLine: {
            value: 15,
            displayValue: '15',
            color: '#2CD02C'
        }
    };
};

moduleForComponent('column-chart', 'Integration | Component | column chart', {
    integration: true,
    beforeEach() {
        this.set('params', getTestParameters());
        this.register('service:resizeDetector', Service.extend({
            setup(elementId, callback) {
                callback();
            },
            teardown() {}
        }));
    }
});

test('it renders', function (assert) {
    this.render(hbs`{{column-chart}}`);
    assert.equal(this.$('.chart.column-chart').length, 1);
});

test('it renders correct number of x axis ticks', function (assert) {
    this.render(hbs`{{column-chart dimension=params.dimensions group=params.groups type=params.type series=params.series xAxis=params.xAxis yAxis=params.yAxis instantRun=true}}`);
    assert.equal(this.$('g.x.axis g.tick').length, 5);
});

test('it renders correct number of y axis ticks', function (assert) {
    this.render(hbs`{{column-chart dimension=params.dimensions group=params.groups type=params.type series=params.series xAxis=params.xAxis yAxis=params.yAxis instantRun=true}}`);
    assert.equal(this.$('g.y.axis g.tick').length, 4);
});

test('it renders a bar for each data point', function (assert) {
    this.render(hbs`{{column-chart dimension=params.dimensions group=params.groups type=params.type series=params.series xAxis=params.xAxis yAxis=params.yAxis instantRun=true}}`);
    assert.equal(this.$('g.sub._0 .chart-body rect.bar').length, 3);
});

test('it shows chart not available', function (assert) {
    this.render(hbs`{{column-chart isChartAvailable=false xAxis=params.xAxis yAxis=params.yAxis instantRun=true}}`);
    // delayed to let all dc rendering processes finish
    later(this, (() => assert.equal(this.$('.chart-not-available').length, 1)), 1000);
    return wait();
});

test('it shows a comparison line', function (assert) {
    this.render(hbs`{{column-chart showComparisonLine=true comparisonLine=params.comparisonLine dimension=params.dimensions group=params.groups type=params.type series=params.series xAxis=params.xAxis yAxis=params.yAxis instantRun=true}}`);
    // delayed to let all dc rendering processes finish
    later(this, (() => assert.equal(this.$('.comparison-line').length, 3)), 1000);
    return wait();
});

test('it renders minimum and maximum value indicators', function (assert) {
    this.render(hbs`{{column-chart seriesMaxMin=2 showMaxMin=true dimension=params.dimensions group=params.groups type=params.type series=params.series xAxis=params.xAxis yAxis=params.yAxis instantRun=true}}`);

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
