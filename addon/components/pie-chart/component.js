import dc from 'dc';
import crossfilter from 'crossfilter';
import BaseChartComponent from '../base-chart-component';
import d3Tip from 'd3-tip';
import d3 from 'd3';

/**
   @public
   @module pie-chart
   @type component
   @desc dc.js pie chart
*/
export default BaseChartComponent.extend({
    classNames: ['pie-chart'],

    externalLabels: false,
    labels: true,

    buildChart() {
        let chart = dc.pieChart(`#${this.get('elementId')}`);

        chart
            .radius(this.get('height') / 2)
            .ordinalColors(this.get('colors'))
            .dimension(this.get('dimension'))
            .group(this.get('group'))
            .renderTitle(false);

        if (this.get('colorMap')) {
            chart.colors(d3.scaleOrdinal().domain(this.get('colorMap')).range(this.get('colors')));
        }

        if (this.get('externalLabels')) {
            chart
                .externalRadiusPadding(this.get('height') * 0.1)
                .externalLabels(this.get('height') * 0.08);
        }

        if (this.get('donutChart')) {
            chart.innerRadius(this.get('height') / 4);
        }

        chart.on('pretransition', chart => {
            if (!this.get('labels') && !this.get('labelsWithValues')) {
                chart.selectAll('text.pie-slice').remove();
            }
        });
        chart.on('renderlet', chart => this.onRenderlet(chart, this.createTooltip()));
        chart.on('postRender', () => {
            if (this.get('labelsWithValues')) {
                this.showValuesOnPieSlice(chart);
            }
        });
        this.set('chart', chart);
    },

    /**
     * Generates labels with values from the data (crossfiltered).
     * Copies attributes and classes from inbuilt labels so that they appear just like dc labels.
     * @param {Object} chart - dc chart object.
     */
    showValuesOnPieSlice(chart) {
        // select all labels
        chart.selectAll('.pie-label-group text').nodes().forEach(n => {
            const d3TextNode = d3.select(n),
                parentNode = d3.select(n.parentNode), // get parent of text element.
                datum = d3TextNode.datum().data; // get data associated with text element.

            // create a new text element, copy classes and transform attrs from pre existing text nodes.
            const newD3TextNode = parentNode.append('text'),
                tspanKeyNode = newD3TextNode.attr('text-anchor', 'middle')
                    .attr('class', d3TextNode.attr('class'))
                    .attr('transform',  d3TextNode.attr('transform'))
                    .append('tspan')
                    .attr('text-anchor', 'middle')
                    .text(datum.key),
                tspanValueNode = newD3TextNode.append('tspan')
                    .attr('text-anchor', 'middle')
                    .text(datum.value);

            // put the value tspan label centered below the key labels.
            const { height, width } = tspanKeyNode.node().getBBox();
            tspanValueNode.attr('dy', height + 2)
                .attr('dx', -width / 2);

            // remove pre existing labels
            d3TextNode.remove();
        });
    },

    onRenderlet(chart, tip) {
        chart.select('g.pie-slice-group > .totalText').remove();
        if (this.get('showTotal')) {
            chart.select('g.pie-slice-group')
                .append('text')
                .attr('class', 'totalText')
                .style('text-anchor', 'middle')
                .text(this.get('data').total);
        }

        if (this.get('showLegend')) {
            chart.select('g.legend').remove();
            const legendDimension = 18;
            const legendWidth = this.get('legendWidth') || 250;
            let legendG = chart.select('g')
                .append('g')
                .attr('transform', `translate(${chart.width() / 2 - legendWidth},${-1 * chart.height() / 4})`);
            this.addLegend(chart, this.getLegendables(chart), legendG, legendDimension);
        }
        this.addClickHandlersAndTooltips(chart.select('svg'), tip);
    },

    getLegendables(chart) {
        let legendables = [];
        let alreadyDone = [];
        for (let i = 0; i < chart.data().length; i++) {
            if (alreadyDone.indexOf(chart.data()[i].key) === -1) {
                let legendable = {};
                legendable.title = chart.data()[i].key;
                legendable.color = chart.getColor(chart.data()[i]);
                legendable.elements = chart.selectAll('.pie-slice').filter(d => d.data.key === legendable.title);
                legendables.push(legendable);
                alreadyDone.push(chart.data()[i].key);
            }
        }
        return legendables;
    },

    createTooltip() {
        return d3Tip()
            .attr('class', 'd3-tip pie-chart')
            .attr('id', this.get('elementId'))
            .style('text-align', 'center')
            .html(d => {
                return `<span class="pie-tip-key">${d.data.key}</span><br/><span class="pie-tip-value">${d.data.value}</span>`;
            });
    },

    addClickHandlersAndTooltips(svg, tip) {
        if (tip && !svg.empty()) {
            svg.call(tip);
        }

        // clicking actions
        this.get('chart').selectAll('.pie-slice').on('click', d => {
            this.onClick(d);
        });

        // tooltip positioning
        let _this = this;
        this.get('chart').selectAll('.pie-slice')
            .on('mouseover.tip', function (d) {
                tip.show(d, this);

                const endAngle = d.endAngle - (Math.PI / 2), startAngle = d.startAngle - (Math.PI / 2);
                const alpha = endAngle - startAngle;
                const radius = _this.get('chart').radius();

                // coordinates of centroid if startAngle = 0
                const xbar = (2 / 3) * (radius / alpha) * Math.sin(alpha);
                const ybar = (-2 / 3) * (radius / alpha) * (Math.cos(alpha) - 1);

                // rotate about (0,0) (center of circle) startAngle radians
                const centroidY = ybar * Math.cos(startAngle) + xbar * Math.sin(startAngle);
                const centroidX = xbar * Math.cos(startAngle) - ybar * Math.sin(startAngle);

                // coordinates of the center point of the chart
                const currentElement = document.querySelector(`#${_this.get('elementId')}`);
                const centerOfChartY = currentElement.offsetTop + (_this.get('chart').height() / 2);
                const centerOfChartX = currentElement.offsetLeft + (_this.get('chart').width() / 2);

                // account for size of tooltip
                const offsetX = ((d.data.key.length + 1) * -4);
                const offsetY = 0;

                tip.style('top', (`${centerOfChartY + centroidY + offsetY}px`));
                tip.style('left', (`${centerOfChartX + centroidX + offsetX}px`));
            })
            .on('mouseout.tip', function (d) {
                tip.hide(d, this);
            });
    },

    showChartNotAvailable() {
        const chartNotAvailableMessage = this.get('chartNotAvailableMessage');
        const chartNotAvailableColor = this.get('chartNotAvailableColor');
        const chartNotAvailableTextColor = this.get('chartNotAvailableTextColor');

        let pieChart = dc.pieChart(`#${this.get('elementId')}`);
        this.set('chart', pieChart);

        const data = [{ key: '', value: 1 }];
        const filter = crossfilter(data);
        const dimension = filter.dimension(d => d);
        const group = dimension.group().reduceCount(g => g);

        pieChart
            .group(group)
            .dimension(dimension)
            .colors(chartNotAvailableColor)
            .renderTitle(false)
            .renderLabel(false)
            .transitionDuration(0);

        if (this.get('donutChart')) {
            pieChart.innerRadius(this.get('height') / 3);
        }

        pieChart.on('pretransition', () => {
            // This is outside the Ember run loop so check if component is destroyed
            if (this.get('isDestroyed') || this.get('isDestroying')) {
                return;
            }

            // Set up any necessary hatching patterns
            let svg = d3.select('.pie-chart > svg');
            svg
                .append('defs')
                .append('pattern')
                .attr('id', 'pieChartNotAvailableHatch')
                .attr('patternUnits', 'userSpaceOnUse')
                .attr('width', 4)
                .attr('height', 4)
                .attr('patternTransform', 'rotate(45)')
                .append('rect')
                .attr('x', '0')
                .attr('y', '0')
                .attr('width', 2)
                .attr('height', 4)
                .attr('fill', chartNotAvailableColor);

            // apply hatching pattern to chart
            svg.select('g > g > g > path').attr('fill', 'url(#pieChartNotAvailableHatch');

            // append text to chart
            svg.select('text').remove();
            let bbox = svg.node().getBBox();
            svg
                .append('text')
                .text(chartNotAvailableMessage)
                .style('fill', chartNotAvailableTextColor)
                .attr('class', 'chart-not-available')
                .attr('text-anchor', 'middle')
                .attr('y', bbox.y + (bbox.height / 2))
                .attr('x', bbox.x + (bbox.width / 2));
        });
        pieChart.render();
    }
});
