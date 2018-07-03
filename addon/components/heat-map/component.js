import moment from 'moment';
// import _ from 'lodash/lodash';
import d3 from 'd3';
import dc from 'dc';
// import crossfilter from 'crossfilter';
// import $ from 'jquery';
import BaseChartComponent from '../base-chart-component';

/**
   @public
   @module heat-map
   @type component
   @desc dc.js heat map
*/
export default BaseChartComponent.extend({
    classNames: ['heat-map'],

    currentInterval: null,
    showCurrentIndicator: false,

    buildChart() {
        let heatMap = dc.heatMap(`#${this.get('elementId')}`);

        heatMap
            .group(this.get('group'))
            .dimension(this.get('dimension'))
            .keyAccessor(d => d.key[1])
            .valueAccessor(d => d.key[0])
            .colors(d3.scale.quantize().domain([0, this.get('colors').length - 1]).range(this.get('colors')))
            .colorAccessor(d => d.value.color)
            .renderTitle(false)
            .height(this.get('height'))
            .colsLabel(d => {
                console.log(moment(d.toString(), 'yyyymmdd'))
                return moment(d.toString(), 'yyyymmdd').format('MMM DD');
            });
        // .x(d3.time.scale().domain(this.get('xAxis').domain))
        // .xUnits(() => this.get('group').size());

        if (this.get('width')) {
            heatMap.width(this.get('width'));
        }

        // if (this.get('yAxis') && this.get('yAxis').domain) {
        //     heatMap.y(d3.scale.linear().domain(this.get('yAxis').domain));
        // }

        // if (this.get('currentInterval') && this.get('showCurrentIndicator') && this.get('xAxis') && this.get('xAxis').ticks) {
        //     heatMap.xAxis().ticks(this.get('xAxis').ticks).tickValues(this.addTickForCurrentInterval());
        // }

        // if (this.get('xAxis') && this.get('xAxis').ticks) {
        //     heatMap.xAxis().ticks(this.get('xAxis').ticks);
        // }

        // if (this.get('yAxis') && this.get('yAxis').ticks) {
        //     heatMap.yAxis().ticks(this.get('yAxis').ticks);
        // }
        let tip = this.createTooltip();

        heatMap
            .on('renderlet', () => this.onRenderlet(tip));

        this.set('chart', heatMap);
    },

    createTooltip() {
        return d3.tip().attr('class', `d3-tip #${this.get('elementId')}`)
            .style('text-align', 'center')
            .html(d => `<span class="row-tip-key">${d.key[0]}</span><br/><span class="row-tip-value">${d.value.value}</span>`);
    },

    onRenderlet(tip) {
        this.addClickHandlersAndTooltips(this.get('chart').select('svg'), tip, 'rect.heat-box');
    }
});