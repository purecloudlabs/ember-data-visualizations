// import _ from 'lodash/lodash';
import d3 from 'd3';
// import dc from 'dc';
import crossfilter from 'crossfilter';
import BaseChartComponent from '../base-chart-component';
import { bubbleCloud } from 'dc-addons';
// import $ from 'jquery';
/**
   @public
   @module bubble-chart
   @type component
   @desc dc.js bubble chart
*/
export default BaseChartComponent.extend({
    classNames: ['bubble-chart'],

    showMaxMin: false,
    showComparisonLine: false,
    currentInterval: null,
    showCurrentIndicator: false,
    maxMinSeries: null,

    buildChart() {
        let bubbleChart = bubbleCloud(`#${this.get('elementId')}`);
        // console.log('in buildChart');

        let data = [
            { date: '12/27/2012', label: 'a1', x: 2, y: 190, bubble: 5 },
            { date: '12/28/2012', label: 'a2', x: 2, y: 10, bubble: 5 },
            { date: '12/29/2012', label: 'a3', x: 95, y: 300, bubble: 10 }
        ];

        let ndx = crossfilter(data);
        let parseDate = d3.time.format('%m/%d/%Y').parse;
        data.forEach(function (d) {
            d.date = parseDate(d.date);
        });
        let dateDim = ndx.dimension(d => d.date);
        let dateGroup = dateDim.group().reduce(function (p, v) {
            ++p.count;
            p.label = v.label;
            p.bubble = v.bubble;
            p.x = v.x;
            p.y = v.y;

            return p;
        },
        function (p) {
            --p.count;
            p.bubble = 0;
            p.label = '';
            p.x = 0;
            p.y = 0;

            return p;
        }, function () {
            return { count: 0, x: 0, y: 0, label: '' };
        });

        bubbleChart
            .width(400)
            .height(400)
            .dimension(dateDim)
            .group(dateGroup)
            .x(d3.scale.ordinal())
            .r(d3.scale.linear())
            .label(p => p.value.label)
            .keyAccessor(p => p.value.x)
            .valueAccessor(p => p.value.y)
            .radiusValueAccessor(p => p.value.bubble);
        this.set('chart', bubbleChart);
    }
});