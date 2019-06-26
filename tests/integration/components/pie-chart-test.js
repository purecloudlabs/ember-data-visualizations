import Service from '@ember/service';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import crossfilter from 'crossfilter';
import d3 from 'd3';

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
        assert.dom('.total-text-group').exists();
    });
});

const collisionTestParameters = function () {
    const rawData = [
        { 'fruit': 'very very  loooong text label1 +X -Y' },
        { 'fruit': 'very very  loooong text label2 +X +Y' },
        { 'fruit': 'very very  loooong text label3 -X +Y' },
        { 'fruit': 'very very  loooong text label4 -X -Y' }
    ];

    const crossfilterData = crossfilter(rawData);
    const dimensions = crossfilterData.dimension(d => d.fruit);
    const groups = dimensions.group();

    return {
        dimensions,
        groups,
        labelCollisionResolution: 'auto',
        labelsWithValues: true
    };
};

function getMidpoint(quadrant) {
    const pieSlicePath = d3.select(document.querySelector(`.pie-slice-group > .pie-slice._${quadrant} > path`));
    const pieSliceNodePathDescription = pieSlicePath.attr('d');
    const arcOnlyPath = pieSliceNodePathDescription.replace(/L.*Z/, '');
    const shadowSVG = d3.select(document.createElementNS('http://www.w3.org/2000/svg', 'svg'));
    const shadowPath = shadowSVG.append('path').attr('d', arcOnlyPath);
    const pathLen = shadowPath.node().getTotalLength();
    return shadowPath.node().getPointAtLength(pathLen / 2);
}
module('Integration | Component | pie chart - collision', function (hooks) {
    setupRenderingTest(hooks);
    hooks.beforeEach(function () {
        this.set('params', collisionTestParameters());
        this.owner.register('service:resizeDetector', Service.extend({
            setup(elementId, callback) {
                callback();
            },
            teardown() { }
        }));
    });

    test('it renders the long label outside the pie slice', async function (assert) {
        await render(hbs`{{pie-chart 
                            dimension=params.dimensions
                            group=params.groups
                            labelCollisionResolution=params.labelCollisionResolution
                            labelsWithValues=params.labelsWithValues
                            instantRun=true
                        }}`);

        let midpoint = getMidpoint(0);
        let labelDimensions = document.querySelector('.pie-label._0 tspan:first-child').getBBox();
        assert.ok(Math.round(midpoint.x) === Math.round(labelDimensions.x), 'it renders the +X +Y long label outside the pie slice');

        midpoint = getMidpoint(1);
        labelDimensions = document.querySelector('.pie-label._1 tspan:first-child').getBBox();
        assert.ok(Math.round(midpoint.x) === Math.round(labelDimensions.x), 'it renders the +X -Y long label outside the pie slice');

        midpoint = getMidpoint(2);
        labelDimensions = document.querySelector('.pie-label._2 tspan:first-child').getBBox();
        assert.ok(Math.round(midpoint.x - labelDimensions.width) === Math.round(labelDimensions.x), 'it renders the -X +Y long label outside the pie slice');
        midpoint = getMidpoint(3);

        labelDimensions = document.querySelector('.pie-label._3 tspan:first-child').getBBox();
        assert.ok(Math.round(midpoint.x - labelDimensions.width) === Math.round(labelDimensions.x), 'it renders the -X -Y long label outside the pie slice');
    });
});