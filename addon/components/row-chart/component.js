// import moment from 'moment';
// import _ from 'lodash/lodash';
// import d3 from 'd3';
import dc from 'dc';
// import crossfilter from 'crossfilter';
// import $ from 'jquery';
import BaseChartComponent from '../base-chart-component';
/**
   @public
   @module row-chart
   @type component
   @desc dc.js row chart
*/
export default BaseChartComponent.extend({
    classNames: ['row-chart'],

    colors: [
        '#1f77b4', '#ff7f0e', '#2ca02c',
        '#9467bd', '#8c564b', '#e377c2',
        '#7f7f7f', '#bcbd22', '#17becf'
    ],

    showMaxMin: false,
    showComparisonLine: false,
    currentInterval: null,
    showCurrentIndicator: false,
    maxMinSeries: null,

    // Horizontal line to mark a target, average, or any kind of comparison value
    // Ex. { value: 0.8, displayValue: '80%', color: '#2CD02C' }
    comparisonLine: null,

    buildChart() {
        let rowChart = dc.rowChart(`#${this.get('elementId')}`);

        const formatter = this.get('yAxis.formatter') || (value => value);

        rowChart
            .group(this.get('group')[2])
            .dimension(this.get('dimension'))
            .ordering((d) => d.key)
            .colors(this.get('colors'))
            .height(this.get('height'))
            .width(this.get('width'))
            // .labelOffsetX(-100)
            .label((d) => formatter(d.key));

        this.set('chart', rowChart);
    }
});