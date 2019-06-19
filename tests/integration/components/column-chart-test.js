import Service from '@ember/service';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
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

        comparisonLines: [{
            value: 15,
            displayValue: '15',
            color: '#2CD02C'
        }]
    };
};

module('Integration | Component | column chart', function (hooks) {
    setupRenderingTest(hooks);

    hooks.beforeEach(function () {
        this.set('params', getTestParameters());
        this.owner.register('service:resizeDetector', Service.extend({
            setup(elementId, callback) {
                callback();
            },
            teardown() {}
        }));
    });

    test('it renders', async function (assert) {
        await render(hbs`{{column-chart}}`);
        assert.dom('.chart.column-chart').exists();
    });

    test('it renders correct number of x axis ticks', async function (assert) {
        await render(hbs`{{column-chart dimension=params.dimensions group=params.groups type=params.type series=params.series xAxis=params.xAxis yAxis=params.yAxis instantRun=true}}`);
        assert.dom('g.x.axis g.tick').exists({ count: 5 });
    });

    test('it renders correct number of y axis ticks', async function (assert) {
        await render(hbs`{{column-chart dimension=params.dimensions group=params.groups type=params.type series=params.series xAxis=params.xAxis yAxis=params.yAxis instantRun=true}}`);
        assert.dom('g.y.axis g.tick').exists({ count: 4 });
    });

    test('it renders a bar for each data point', async function (assert) {
        await render(hbs`{{column-chart dimension=params.dimensions group=params.groups type=params.type series=params.series xAxis=params.xAxis yAxis=params.yAxis instantRun=true}}`);
        assert.dom('g.sub._0 .chart-body rect.bar').exists({ count: 3 });
    });

    test('it shows chart not available', async function (assert) {
        await render(hbs`{{column-chart isChartAvailable=false xAxis=params.xAxis yAxis=params.yAxis instantRun=true}}`);
        assert.dom('.chart-not-available').exists();
    });

    test('it shows comparison lines', async function (assert) {
        await render(hbs`{{column-chart showComparisonLines=true comparisonLines=params.comparisonLines dimension=params.dimensions group=params.groups type=params.type series=params.series xAxis=params.xAxis yAxis=params.yAxis instantRun=true}}`);
        assert.dom('.comparison-line').exists({ count: 3 });
    });

    test('it renders minimum and maximum value indicators', async function (assert) {
        await render(hbs`{{column-chart seriesMaxMin=2 showMaxMin=true dimension=params.dimensions group=params.groups type=params.type series=params.series xAxis=params.xAxis yAxis=params.yAxis instantRun=true}}`);

        assert.dom('.max-value-text').exists();
        assert.dom('.max-value-indicator').exists();
        assert.dom('.min-value-text').exists();
        assert.dom('.min-value-indicator').exists();
    });

    test('it renders a legend with the correct number of boxes', async function (assert) {
        await render(hbs`{{column-chart dimension=params.dimensions group=params.groups seriesData=params.seriesData type=params.type series=params.series xAxis=params.xAxis yAxis=params.yAxis showLegend=true instantRun=true}}`);
        assert.dom('.legend-container > .legend-item').exists({ count: 3 });
    });

    test('it renders a legend even when there are no groups', async function (assert) {
        this.set('groups', []);
        await render(hbs`{{column-chart dimension=params.dimensions group=groups seriesData=params.seriesData type=params.type series=params.series xAxis=params.xAxis yAxis=params.yAxis showLegend=true instantRun=true}}`);
        assert.dom('.legend-container > .legend-item').exists({ count: 3 });
    });
});

// collision detection test parameters
const collisionTestParameters = function () {
    return {
        type: 'GROUPED',

        series: [
            {
                title: 'Total Fruit Eaten'
            }
        ],

        xAxis: {
            domain: [
                moment('2016-11-01'),
                moment('2016-11-07')
            ],
            ticks: 5
        },

        yAxis: {
            ticks: 3,
            domain: [5, 55]
        },

        labelOptions: {
            showMaxMin: true,
            showDataValues: true,
            labelCollisionResolution: 'auto'
        }
    };
};

const rawData = [
    {
        date: new Date('2016-11-02'),
        fruits: 10
    },
    {
        date: new Date('2016-11-03'),
        fruits: 20
    },
    {
        date: new Date('2016-11-04'),
        fruits: 30
    },
    {
        date: new Date('2016-11-05'),
        fruits: 40
    },
    {
        date: new Date('2016-11-06'),
        fruits: 50
    }
];

const createDimensionAndGroup = (data) => {
    const dimension = crossfilter(data).dimension(d => d.date);
    const group = [dimension.group().reduceSum(item => item.fruits)];
    return {
        dimension,
        group
    };
};

module('Integration | Component | column chart - collision', function (hooks) {
    setupRenderingTest(hooks);
    hooks.beforeEach(function () {
        this.set('params', collisionTestParameters());
        this.owner.register('service:resizeDetector', Service.extend({
            setup(elementId, callback) {
                callback();
            },
            teardown() {}
        }));
    });

    test('removes any regular label that overlaps max from the left', async function (assert) {
        rawData[3].fruits = 40.23232323232323;
        const dimAndGrp = createDimensionAndGroup(rawData);
        this.set('params.dimension', dimAndGrp.dimension);
        this.set('params.group', dimAndGrp.group);
        await render(
            hbs `{{column-chart
                    dimension=params.dimension
                    group=params.group
                    type=params.type
                    seriesMaxMin=0
                    series=params.series
                    xAxis=params.xAxis
                    yAxis=params.yAxis
                    labelOptions=params.labelOptions
                    height=200
                    instantRun=true
                }}`);
        assert.equal([...document.querySelectorAll('.data-text')].map(d => d.innerHTML).indexOf('40.23232323232323'), -1, 'Expected chart does not have regular label if it overlaps max.');
        assert.dom('.data-text').exists({ count: 2 }, 'Expected 5 data values to be rendered');
    });

    test('removes any regular label if max overlaps that from the left', async function (assert) {
        rawData[3].fruits = 40.23232323232323;
        rawData[4].fruits = 45;
        const dimAndGrp = createDimensionAndGroup(rawData);
        this.set('params.dimension', dimAndGrp.dimension);
        this.set('params.group', dimAndGrp.group);
        await render(
            hbs `{{column-chart
                    dimension=params.dimension
                    group=params.group
                    type=params.type
                    seriesMaxMin=0
                    series=params.series
                    xAxis=params.xAxis
                    yAxis=params.yAxis
                    labelOptions=params.labelOptions
                    height=200
                    instantRun=true
                }}`);
        assert.equal([...document.querySelectorAll('.data-text')].map(d => d.innerHTML).indexOf('40.23232323232323'), -1, 'Expected chart does not have regular label if max overlaps it.');
    });

    test('do not remove any regular label if it does not overlap max', async function (assert) {
        rawData[3].fruits = 40;
        rawData[4].fruits = 50;
        const dimAndGrp = createDimensionAndGroup(rawData);
        this.set('params.dimension', dimAndGrp.dimension);
        this.set('params.group', dimAndGrp.group);
        await render(
            hbs `{{column-chart
                    dimension=params.dimension
                    group=params.group
                    type=params.type
                    seriesMaxMin=0
                    series=params.series
                    xAxis=params.xAxis
                    yAxis=params.yAxis
                    labelOptions=params.labelOptions
                    height=200
                    instantRun=true
                }}`);
        assert.notEqual([...document.querySelectorAll('.data-text')].map(d => d.innerHTML).indexOf('40'), -1, 'Expected regular label that does not overlap max ');
    });

    test('remove any regular label if some other regular label overlaps it from left.', async function (assert) {
        rawData[2].fruits = 30.2323232323232;
        rawData[3].fruits = 40;
        const dimAndGrp = createDimensionAndGroup(rawData);
        this.set('params.dimension', dimAndGrp.dimension);
        this.set('params.group', dimAndGrp.group);
        await render(
            hbs `{{column-chart
                    dimension=params.dimension
                    group=params.group
                    type=params.type
                    seriesMaxMin=0
                    series=params.series
                    xAxis=params.xAxis
                    yAxis=params.yAxis
                    labelOptions=params.labelOptions
                    height=200
                    instantRun=true
                }}`);
        assert.equal([...document.querySelectorAll('.data-text')].map(d => d.innerHTML).indexOf('40'), -1, 'Expected no regular label to the right of long label.');
    });

    test('remove min label and indicator if it overlaps max.', async function (assert) {
        rawData[0].fruits = 41;
        rawData[1].fruits = 42;
        rawData[2].fruits = 40.2323232323232;
        rawData[3].fruits = 50;
        rawData[4].fruits = 49;
        const dimAndGrp = createDimensionAndGroup(rawData);
        this.set('params.dimension', dimAndGrp.dimension);
        this.set('params.group', dimAndGrp.group);
        await render(
            hbs `{{column-chart
                    dimension=params.dimension
                    group=params.group
                    type=params.type
                    seriesMaxMin=0
                    series=params.series
                    xAxis=params.xAxis
                    yAxis=params.yAxis
                    labelOptions=params.labelOptions
                    height=200
                    instantRun=true
                }}`);
        assert.dom('.min-value-text').doesNotExist('Expected no min label');
        assert.dom('.min-value-indicator').doesNotExist('Expected no min label indicator');
    });
});