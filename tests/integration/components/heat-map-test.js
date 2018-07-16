import Service from '@ember/service';
import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';
import crossfilter from 'crossfilter';
import wait from 'ember-test-helpers/wait';
import { later } from '@ember/runloop';
import moment from 'moment';

const getTestParameters = function () {
    const rawData = [
        { date: new Date('2016-11-02'), queue: 'Service', value: 0.7 },
        { date: new Date('2016-11-02'), queue: 'IT', value: 0.8 },
        { date: new Date('2016-11-02'), queue: 'Manufacturing', value: 0.3 },
        { date: new Date('2016-11-03'), queue: 'Service', value: 0.4 },
        { date: new Date('2016-11-03'), queue: 'IT', value: 0.9 },
        { date: new Date('2016-11-03'), queue: 'Manufacturing', value: 0.7 },
        { date: new Date('2016-11-04'), queue: 'Service', value: 0.7 },
        { date: new Date('2016-11-04'), queue: 'IT', value: 0.9 },
        { date: new Date('2016-11-04'), queue: 'Manufacturing', value: 0.4 }
    ];

    const crossfilterData = crossfilter(rawData);
    const dimension = crossfilterData.dimension(d => [d.queue, d.date]);

    let group = dimension.group().reduce(
        (p, v) => {
            return v.value;
        },
        () => { },
        () => ({})
    );

    return {
        dimension,
        group,
        xAxis: {
            domain: [
                moment('2016-11-01'),
                moment('2016-11-05')
            ],
            ticks: 3
        },

        yAxis: {
            ticks: 3
        },

        colorMap: [0.3, 0.4, 0.7, 0.8, 0.9],
        keyFormat: key => moment(key.toString()).format('MMM DD')
    };
};

moduleForComponent('heat-map', 'Integration | Component | heat map', {
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
    this.render(hbs`{{heat-map}}`);
    assert.equal(this.$('.chart.heat-map').length, 1);
});

test('it renders a rectangle for each data point', function (assert) {
    this.render(hbs`{{heat-map dimension=params.dimension group=params.group xAxis=params.xAxis yAxis=params.yAxis colorMap=params.colorMap keyFormat=params.keyFormat instantRun=true}}`);
    assert.equal(this.$('rect.heat-box').length, 9);
});

test('it renders correct number of x axis ticks', function (assert) {
    this.render(hbs`{{heat-map dimension=params.dimension group=params.group xAxis=params.xAxis yAxis=params.yAxis colorMap=params.colorMap keyFormat=params.keyFormat instantRun=true}}`);
    later(this, (() => assert.equal(this.$('.cols text.tickLabel:not(.hidden)').length, 3)), 1000);
    return wait();
});

test('it renders a legend', function (assert) {
    this.render(hbs`{{heat-map dimension=params.dimension group=params.group xAxis=params.xAxis yAxis=params.yAxis colorMap=params.colorMap keyFormat=params.keyFormat legend=true instantRun=true}}`);
    later(this, (() => assert.equal(this.$('g.legend > g.legendItem').length, 5)), 1000);
    return wait();
});

test('it shows chart not available', function (assert) {
    this.render(hbs`{{heat-map isChartAvailable=false xAxis=params.xAxis keyFormat=params.keyFormat instantRun=true}}`);
    // delayed to let all dc rendering processes finish
    later(this, (() => assert.equal(this.$('.chart-not-available').length, 1)), 1000);
    return wait();
});