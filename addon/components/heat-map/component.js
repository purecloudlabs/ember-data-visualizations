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

        if (!this.get('xAxis') || !this.get('xAxis').domain) {
            return;
        }

        let xAxisTickLabels = [], yAxisTickLabels = [];
        let xCounts = {}, yCounts = {};
        this.get('group').all().forEach(d => xAxisTickLabels.push(d.key[1]));
        this.get('group').all().forEach(d => yAxisTickLabels.push(d.key[0]));

        for (let i = 0; i < xAxisTickLabels.length; i++) {
            xCounts[xAxisTickLabels[i]] = 1 + (xCounts[xAxisTickLabels[i]] || 0);
            yCounts[yAxisTickLabels[i]] = 1 + (yCounts[yAxisTickLabels[i]] || 0);
        }
        yAxisTickLabels = Object.keys(yCounts);
        const numbCols = Object.keys(xCounts).length;
        const numbRows = Object.keys(yCounts).length;

        const labelWidth = Math.max(...(yAxisTickLabels.map(el => el.length))) * 8;
        const tickWidth = 10;
        const rightMargin = this.get('legend') && this.get('legendWidth') ? this.get('legendWidth') : 5;
        const colorMap = this.get('colorMap');

        heatMap
            .group(this.get('group'))
            .dimension(this.get('dimension'))
            .margins({
                top: 30,
                right: rightMargin,
                bottom: 50,
                left: labelWidth + tickWidth
            })
            .keyAccessor(d => d.key[1])
            .valueAccessor(d => d.key[0])
            .colors(d3.scale.quantize().domain([0, this.get('colors').length - 1]).range(this.get('colors')))
            .colorAccessor(d => colorMap.indexOf(d.value.value))
            .renderTitle(false)
            .height(this.get('height'))
            .colsLabel(d => moment(d.toString()).format('MMM DD'))
            .transitionDuration(0);

        if (this.get('width')) {
            heatMap.width(this.get('width'));
        }

        const minBoxWidth = this.get('minBoxWidth') || 4;
        const minEffectiveWidth = minBoxWidth * numbCols;
        const shortenLabels = minEffectiveWidth > heatMap.effectiveWidth();
        // if there isn't enough room for each box to be minBoxWidth wide with full labels, truncate labels until there is
        heatMap.rowsLabel(d =>
            shortenLabels && d.length * 9 > heatMap.width() - minEffectiveWidth
                ? `${d.substring(0, Math.floor((heatMap.width() - minEffectiveWidth) / 9) - 2)}...`
                : d
        );

        // adjust margins if labels are truncated
        if (shortenLabels) {
            heatMap.margins().left = heatMap.width() - minEffectiveWidth;
        }

        let tip = this.createTooltip();

        heatMap
            .on('pretransition', chart => this.onPretransition(chart, labelWidth, numbRows, numbCols))
            .on('renderlet', () => this.onRenderlet(tip));

        this.set('chart', heatMap);
    },

    createTooltip() {
        return d3.tip().attr('class', `d3-tip #${this.get('elementId')}`)
            .style('text-align', 'center')
            .html(d => `<span class='row-tip-key'>${d.key[0]}</span><br/><span class='row-tip-value'>${d.value.value}</span>`);
    },

    onPretransition(chart, labelWidth, numbRows, numbCols) {
        const g = chart.select('g.heatmap');

        // add tickLabel class to tick labels
        g.selectAll('text').attr('class', 'tickLabel');

        this.addXAxis(chart, labelWidth, numbCols);
        this.addYAxis(chart, numbRows);
        this.addLegend(chart);
    },

    addLegend(chart) {
        // const width = this.get('legendWidth') || 150;
        console.log(this.get('colorMap'));
        const legendDimension = 18;
        const numberRectangles = Object.keys(this.get('colorMap')).length;
        let legendG = chart.select('g')
            .append('g')
            .attr('class', 'legend')
            .attr('transform', `translate(${chart.effectiveWidth()},${chart.effectiveHeight() / 4})`);
        for (let i = 0; i < numberRectangles; i++) {
            legendG.append('rect')
                .attr('y', (i + 1) * 22)
                .attr('height', legendDimension)
                .attr('width', legendDimension)
                .attr('fill', this.get('colors')[i])
                .on('click', () => {
                    let match = chart.selectAll('.heat-box').filter(d => d.value.value == this.get('colorMap')[i]);
                    let matchLegend = chart.selectAll('.legend > rect').filter(d => {console.log(this); d.value.value == this.get('colorMap')[i]});
                    match.classed('selected', !match.classed('selected'));
                    // matchLegend.classed('')

                    let noMatch = chart.selectAll('.heat-box').filter(d => d.value.value !== this.get('colorMap')[i]);
                    let noMatchLegend = chart.selectAll('.legend > rect').filter(d => d.value.value !== this.get('colorMap')[i]);
                    noMatch.classed('hidden', !noMatch.classed('hidden'));
                });
            legendG.append('text')
                .attr('x', legendDimension + 2)
                .attr('y', (i + 1) * 22 + (legendDimension * 0.75))
                .text(this.get('colorMap')[i]);
        }
    },

    isIntervalIncluded(ticks, interval) {
        return ticks.toString().indexOf(interval.toString()) !== -1;
    },

    addXAxis(chart, labelWidth, numbCols) {
        const axisX = chart.select('g.heatmap').select('.cols.axis'),
            axisXG = axisX.append('g').attr('class', 'axisLines');

        // move x axis labels down slightly
        axisX.selectAll('text').attr('dy', '1.2em');

        // add x axis line
        axisXG.append('line')
            .attr('x1', 0)
            .attr('x2', chart.effectiveWidth())
            .attr('y1', chart.effectiveHeight())
            .attr('y2', chart.effectiveHeight());

        // add x axis ticks
        let xTextPositions = [];
        let textValues = [];
        axisX.selectAll('text').each(function (d) {
            xTextPositions.push(d3.select(this).attr('x'));
            textValues.push(d);
        });
        let textLengths = [];
        textValues.forEach(d => textLengths.push(chart.colsLabel()(d).length));

        let numberOfTickLabels = (this.get('xAxis').ticks || this.get('group').size()) + 1;
        let ticksLabels;
        do {
            ticksLabels = d3.time.scale().domain(this.get('xAxis').domain).ticks(numberOfTickLabels);
            numberOfTickLabels--;
        } while (ticksLabels.length * Math.max(...textLengths) * 11 > chart.effectiveWidth());

        const ticks = d3.time.scale().domain(this.get('xAxis').domain).ticks(this.get('xAxis').tickMarks);
        for (let i = 0; i <= numbCols - 1; i++) {
            axisXG.append('line')
                .attr('class', 'tickMark')
                .attr('x1', xTextPositions[i])
                .attr('x2', xTextPositions[i])
                .attr('y1', chart.effectiveHeight())
                .attr('y2', chart.effectiveHeight() + 6);
        }

        // hide ticks and labels that aren't necessary
        axisX.selectAll('text.tickLabel')
            .filter(d => ticksLabels.map(Number).indexOf(+moment(d.toString()).toDate()) === -1)
            .classed('hidden', true);
        axisXG.selectAll('line.tickMark')
            .filter((d, i) =>
                ticks.map(Number).indexOf(+moment(textValues[i].toString()).toDate()) === -1
                && ticksLabels.map(Number).indexOf(+moment(textValues[i].toString()).toDate()) === -1)
            .classed('hidden', true);

        // add current period indicator
        if (this.get('showCurrentIndicator') && this.get('currentInterval')) {
            axisXG.selectAll('line.tickMark')
                .filter((d, i) => moment(textValues[i].toString()).isSame(this.get('currentInterval').start._d))
                .classed('hidden', false);

            let indicatorDate = this.get('currentInterval.start._d');
            let currentTick = axisX.selectAll('text.tickLabel')
                .filter(d => moment(d.toString()).isSame(this.get('currentInterval').start._d));
            if (!currentTick.empty()) {
                if (currentTick.text().indexOf('\u25C6') === -1) {
                    let tickHtml = this.isIntervalIncluded(ticks, indicatorDate) ? `\u25C6 ${currentTick.text()}` : '\u25C6';
                    currentTick.html(tickHtml);
                }
                currentTick.classed('hidden', false);
            }
        }

        // add x axis label
        const xAxisLabelClass = 'xLabel';

        let axisXLab = axisX.selectAll(`text.${xAxisLabelClass}`);
        if (axisXLab.empty() && this.get('xAxis').label) {
            axisXLab = axisX.append('text')
                .attr('class', xAxisLabelClass)
                .attr('y', parseInt(axisX.select('text').attr('y')) + parseInt(axisX.select('text').attr('dy')))
                .attr('dy', '2.5em')
                .attr('x', chart.width() / 2 - labelWidth)
                .attr('text-anchor', 'middle');
        }
        if (this.get('xAxis').label && axisXLab.text() !== this.get('xAxisLabel')) {
            axisXLab.text(this.get('xAxis').label);
        }
    },

    addYAxis(chart, numbRows) {
        const axisY = chart.select('g.heatmap').select('.rows.axis'),
            axisYG = axisY.append('g').attr('class', 'axisLines')
                .attr('transform', `translate(${(chart.margins().left) * -1},0)`);

        // add y axis line
        axisYG.append('line')
            .attr('x1', chart.margins().left)
            .attr('x2', chart.margins().left)
            .attr('y1', 0)
            .attr('y2', chart.effectiveHeight());

        // add y axis ticks
        let yTextPositions = [];
        axisY.selectAll('text').each(function () {
            yTextPositions.push(d3.select(this).attr('y'));
        });

        for (let i = 0; i <= numbRows - 1; i++) {
            axisYG.append('line')
                .attr('x1', chart.margins().left)
                .attr('x2', chart.margins().left - 6)
                .attr('y1', yTextPositions[i])
                .attr('y2', yTextPositions[i]);
        }

        // add y axis label
        const yAxisLabelClass = 'yLabel';

        let axisYLab = axisY.selectAll(`text.${yAxisLabelClass}`);
        if (axisYLab.empty() && this.get('yAxis').label) {
            axisYLab = axisY.append('text')
                .attr('class', yAxisLabelClass)
                .attr('dx', parseInt(axisY.select('text').attr('dx')));
        }
        if (this.get('yAxis').label && axisYLab.text() !== this.get('yAxisLabel')) {
            axisYLab.text(this.get('yAxis').label);
        }

        axisY.selectAll('text')
            .attr('text-anchor', 'left')
            .style('text-anchor', '')
            .attr('transform', `translate(${-1 * (chart.margins().left - 5)},0)`);
    },

    onRenderlet(tip) {
        this.addClickHandlersAndTooltips(this.get('chart').select('svg'), tip, 'rect.heat-box');
    }
});