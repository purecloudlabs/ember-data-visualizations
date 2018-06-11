// import moment from 'moment';
import _ from 'lodash/lodash';
import d3 from 'd3';
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
        '#7ADB37', '#FC0D1C', '#FDBA43'
    ],

    buildChart() {
        let chart = dc.pieChart(`#${this.get('elementId')}`);

        const colors = [
            '#7ADB37', '#FDBA43', '#FC0D1C'
        ];

        // const colorScale = d3.scale.ordinal().range([this.get('colors')]);

        chart
            .height(this.get('height'))
            .width(this.get('width'))
            .ordinalColors(colors)
            .dimension(this.get('dimension'))
            .group(this.get('group'))
            .legend(dc.legend()
                .gap(15)
                .y(10)
                .x(30));

        if (this.get('donutChart')) {
            chart.innerRadius(100);
        }

        let tip = this.createTooltip();
        chart.on('renderlet', () => this.onRenderlet(tip));

        this.set('chart', chart);
    },

    onRenderlet(tip) {
        if (this.get('showTotal')) {
            d3.select('.pie-chart > svg')
                .append('text')
                .attr({ 'text-anchor': 'middle' })
                .attr('transform', `translate (${this.get('width') / 2}, ${this.get('height') / 2})`)
                .text(this.get('data').total);
        }
        this.addClickHandlersAndTooltips(d3.select('.pie-chart > svg'), tip, '.pie-slice');
    },

    createTooltip() {
        const formatter = this.get('xAxis.formatter') || (value => value);
        const titles = this.get('series').map(entry => entry.key);
        let tip = d3.tip().attr('class', `d3-tip #${this.get('elementId')}`).html(d => {
            if (!_.isEmpty(titles)) {
                let str = '';
                titles.forEach((title, i) => {
                    const datum = formatter(this.get('data')[d.data.key][i]);
                    const secondaryClass = d.y === datum ? 'primary-stat' : '';
                    str = str.concat(`<span class="tooltip-list-item"><span class="tooltip-label ${secondaryClass}">${title}</span><span class="tooltip-value ${secondaryClass}">${datum}</span></span>`);
                });
                return str;
            }

            return `<span class="tooltip-value">${d.data.value}</span>`;
        });

        return tip;
    },

    onClick(d) {
        const allSlices = this.get('chart').selectAll('g.pie-slice');
        const thisSlice = allSlices.filter(pieD => pieD == d);
        const siblings = allSlices.filter(pieD => pieD !== d);

        if (thisSlice.style('opacity') == 1) {
            // either there is no selection or this slice is selected
            if (siblings.style('opacity') == 1) {
                // no selection yet: select this element
                thisSlice.style('opacity', 1);
                siblings.style('opacity', .5);
            } else {
                // this is selected: unselect all
                allSlices.style('opacity', 1);
            }
        } else {
            // another slice is selected: select this one instead
            thisSlice.style('opacity', 1);
            siblings.style('opacity', .5);
        }
    }
});