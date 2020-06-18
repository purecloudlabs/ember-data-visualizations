import dc from 'dc';
import crossfilter from 'crossfilter';
import BaseChartComponent from '../base-chart-component';
import d3Tip from 'd3-tip';
import d3 from 'd3';
import { reads } from '@ember/object/computed';

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
    formatter: d => d,

    chartId: reads('elementId'),

    _getBaseChart() {
        return this._super(...arguments);
    },

    buildChart() {
        if (this.get('group') && this.get('group') .all().length === 0) {
            this.showChartNotAvailable();
            return;
        }

        let chart = this._getBaseChart('pieChart');

        chart
            .radius(this.get('height') / 2)
            .ordinalColors(this.get('colors'))
            .dimension(this.get('dimension'))
            .group(this.get('group'));

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
        this.set('chart', chart);

        // disable factory click handler.
        chart.onClick = () => {};

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
            if (this.get('labelCollisionResolution') === 'auto' && !this.get('externalLabels')) {
                this.collisionResolution(chart);
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
                    .text(this.get('formatter')(datum.value));

            // put the value tspan label centered below the key labels.
            const { height, width } = tspanKeyNode.node().getBBox();
            tspanValueNode.attr('dy', height + 2)
                .attr('dx', -width / 2);

            // remove pre existing labels
            d3TextNode.remove();
        });
    },

    onRenderlet(chart, tip) {
        chart.select('g.pie-slice-group > .total-text-group').remove();
        if (this.get('showTotal')) {
            const textLabel = chart.select('g.pie-slice-group').append('g')
                .attr('class', 'total-text-group')
                .append('text')
                .attr('class', 'total-text')
                .attr('text-anchor', 'middle')
                .text(this.get('formatter')(this.get('data').total));
            const { x, y, width, height } = textLabel.node().getBBox(), padding = 6;
            chart.select('g.total-text-group').insert('rect', 'text.total-text')
                .attr('width', width + padding)
                .attr('height', height + padding)
                .attr('x', x - padding / 2)
                .attr('y', y - padding / 2)
                .attr('rx', '2')
                .attr('ry', '2')
                .attr('class', 'total-text-rect');
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
            .attr('class', `d3-tip ${this.get('chartId')}`)
            .style('text-align', 'center')
            .html(d => {
                return `<span class="pie-tip-key">${d.data.key}</span><br/><span class="pie-tip-value">${this.get('formatter')(d.data.value)}</span>`;
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
                const currentElement = document.querySelector(`#${_this.get('chartId')}`);
                const centerOfChartY = currentElement.offsetTop + (_this.get('chart').height() / 2);
                const centerOfChartX = currentElement.offsetLeft + (_this.get('chart').width() / 2);

                // account for size of tooltip
                const offsetX = ((d.data.key.length + 1) * -4);
                const offsetY = 0;

                tip.style('top', (`${centerOfChartY + centroidY + offsetY}px`));
                tip.style('left', (`${centerOfChartX + centroidX + offsetX}px`));
                tip.style('pointer-events', 'none');
            })
            .on('mouseout.tip', function (d) {
                tip.hide(d, this);
            });
    },

    showChartNotAvailable() {
        const chartNotAvailableMessage = this.get('chartNotAvailableMessage');
        const chartNotAvailableColor = this.get('chartNotAvailableColor');
        const chartNotAvailableTextColor = this.get('chartNotAvailableTextColor');

        const pieChart = this._getBaseChart();
        this.set('chart', pieChart);

        const data = [{ key: '', value: 1 }];
        const filter = crossfilter(data);
        const dimension = filter.dimension(d => d);
        const group = dimension.group().reduceCount(g => g);


        pieChart
            .group(group)
            .dimension(dimension)
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
    },

    /**
     * Detects and resolves collision among pie slices and labels.
     * Renders the collided labels at the mid point of the arc of the pie slices but outside the slices.
     * Calculates arc of the pie slice by creating a shadow element consisting of the pie slice path minus then end 'line To' instruction of the path.
     * then the total length of the path is calculated and a point is marked at half the total length of the path.
     * @param {object} chart pie-chart object.
     */
    collisionResolution(chart) {
        function doesCollide(labelNode) {
            return chart.selectAll('.pie-slice-group > .pie-slice').nodes().map(ps => {
                const sliceDimensions = ps.getBBox();
                const labelNodeDimensions = labelNode.getBBox();
                /* collision in horizontal way:
                 *     1. if pieslice bbox abscissa is less than label abscissa (overflow in left direction.)
                 *     2. if pie slice bbox width is less than label bbox width (overflow in right direction.)
                 * collision in vertical way:
                 *      if pie slice label bbox bottom edge is deeper than pie slice bbox bottom edge.
                 *
                 *      ---------------
                 *      |pieSlice bbox|
                 *      |             |
                 *      |   ----------------
                 *      |   |  label bbox  |
                 *      |   ----------------
                 *      |_____________|
                 *                                                      ---------------------
                 *                                                      |  pieSlice bbox    |
                 *              ---------------                         |                   |
                 *              |pieSlice bbox|                         |                   |
                 *              |             |                         |                   |
                 *          --------------    |                         |   --------------- |
                 *          | label bbox |    |                         |   | label bbox  | |
                 *          --------------    |                         --- |_____________|--
                 *              |_____________|
                 *
                 * factor to account for bbox curvature = 0.8.
                 * The case when label overlaps from top edge will never arise because label values over flow from the bottom.
                 */
                return (labelNodeDimensions.x < sliceDimensions.x || labelNodeDimensions.width > sliceDimensions.width * 0.8) || (sliceDimensions.y + sliceDimensions.height * 0.8 < labelNodeDimensions.y + labelNodeDimensions.height);
            }).some(d => d);
        }
        chart.selectAll('.pie-label-group  text').nodes().forEach(n => {
            if (!doesCollide(n)) {
                return;
            }
            const d3TextNode = d3.select(n).attr('transform', null);
            d3TextNode.select('tspan:nth-child(2)').attr('dx', 10).attr('dy', 0);

            // find out what pieSlice the label belongs to.
            const pieSliceRegex = new RegExp('(_\\d+)');
            const classes = n.getAttribute('class');
            const match = pieSliceRegex.exec(classes);
            const pieSliceClass = `.pie-slice.${match[1]}`;

            // find out the path and extract the instructions of the path renderer.
            const pieSliceNode = chart.select(`${pieSliceClass} > path`);
            const pieSliceNodePathDescription = pieSliceNode.attr('d');

            /*
            * ----------------------------------------------------------------------------------------
            * shadow Path calculations.
            * Important: The origin (0,0) starts at the middle of the svg elements and not a top left.
            * ----------------------------------------------------------------------------------------
            */

            // remove the 'Line To' instruction from the path, so that it becomes an arc.
            const arcOnlyPath = pieSliceNodePathDescription.replace(/L.*Z/, '');

            // create (but do not render) shadow Path element.
            const shadowSVG = d3.select(document.createElementNS('http://www.w3.org/2000/svg', 'svg'));
            const shadowPath = shadowSVG.append('path')
                .attr('d', arcOnlyPath);

            const pathLen = shadowPath.node().getTotalLength();
            const midpoint = shadowPath.node().getPointAtLength(pathLen / 2); // get point  at half the total length
            let textNodeDimensions = n.getBBox();

            /* The coordinate system of svg elements in pie-chart.

                                |
                             (-ve Y)
                                |
                                |
                                |
            -------(-ve X)-------------(+ve X)-------
                                |(o,o)
                                |
                                |
                                |
                             (+ve Y)
                                |

            * Based on the sign on the mid point's coordinates the position of the label is decided.
            */
            if (midpoint.x >= 0) {
                d3TextNode.attr('x', midpoint.x + textNodeDimensions.width / 2);
            } else {
                d3TextNode.attr('x', midpoint.x - textNodeDimensions.width / 2);
            }

            if (midpoint.y >= 0) {
                d3TextNode.attr('y', midpoint.y + textNodeDimensions.height / 2);
            } else {
                d3TextNode.attr('y', midpoint.y - textNodeDimensions.height / 2);
            }

            shadowSVG.remove();
        });
    }
});
