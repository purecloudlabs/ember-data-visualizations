// import moment from 'moment';
// import _ from 'lodash/lodash';
// import d3 from 'd3';
import dc from 'dc';
// import crossfilter from 'crossfilter';
// import $ from 'jquery';
import BaseChartComponent from '../base-chart-component';

/**
   @public
   @module pie-chart
   @type component
   @desc dc.js pie chart
*/
export default BaseChartComponent.extend({
    classNames: ['pie-chart'],

    colors: [
        '#1f77b4', '#ff7f0e', '#2ca02c',
        '#9467bd', '#8c564b', '#e377c2',
        '#7f7f7f', '#bcbd22', '#17becf'
    ],

    buildChart() {
        let chart = dc.pieChart(`#${this.get('elementId')}`);

        chart
            .height(this.get('height'))
            .width(this.get('height'))
            .slicesCap(20)
            .innerRadius(100)
            .dimension(this.get('dimension'))
            .group(this.get('group'))
            .legend(dc.legend());

        this.set('chart', chart);
    }
});