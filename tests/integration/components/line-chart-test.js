import Ember from 'ember';
import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';
import moment from 'moment';
import crossfilter from 'crossfilter';

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
        seriesData: rawData,
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
        }
    };
};

moduleForComponent('line-chart', 'Integration | Component | line chart', {
    integration: true,
    beforeEach() {
        this.set('params', getTestParameters());
        this.register('service:resizeDetector', Ember.Service.extend({
            setup(elementId, callback) {
                callback();
            },
            teardown() {}
        }));
    }
});

test('it renders', function (assert) {
    this.render(hbs`{{line-chart}}`);
    assert.equal(this.$('.chart.line-chart').length, 1);
});

test('it renders correct number of x axis ticks', function (assert) {
    this.render(hbs`{{line-chart dimension=params.dimensions group=params.groups seriesData=params.seriesData series=params.series xAxis=params.xAxis yAxis=params.yAxis instantRun=true}}`);
    assert.equal(this.$('g.x.axis g.tick').length, 5);
});

test('it renders correct number of y axis ticks', function (assert) {
    this.render(hbs`{{line-chart dimension=params.dimensions group=params.groups seriesData=params.seriesData series=params.series xAxis=params.xAxis yAxis=params.yAxis instantRun=true}}`);
    assert.equal(this.$('g.y.axis g.tick').length, 4);
});

test('it renders a point for each data point', function (assert) {
    this.render(hbs`{{line-chart dimension=params.dimensions group=params.groups seriesData=params.seriesData series=params.series xAxis=params.xAxis yAxis=params.yAxis instantRun=true}}`);
    assert.equal(this.$('g.sub._0 .chart-body circle.dot').length, 3);
});
