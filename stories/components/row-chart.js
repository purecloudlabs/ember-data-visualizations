import hbs from 'htmlbars-inline-precompile';
import moment from 'moment';
import crossfilter from 'crossfilter';
import content from '../content/row-chart-data.json';

export const rowChartConfigOptions = () => {
    return {
        template: hbs`
        {{row-chart
            dimension=dimension
            group=group
            colors=colors
            xAxis=yAxis
            hideXAxisLines=true
            showYTicks=true
            showYGridLines=true
            showMaxMin=true
            showComparisonLine=true
            comparisonLine=false
            legendWidth=300
        }}`,
        context: {
            dimension: dimensions,
            group: groups,
            type: 'GROUPED',
            colors,
            height: 400,
            yAxis: {
                domain: [moment('2016-10-31T00:00:00.000Z'), moment('2016-12-03T00:00:00.000Z')],
                ticks: 3,
                tickMarks: 3
            },
            xAxis: {
                ticks: 10
            }
        }
    };
};

let dimensions = {};
let groups = {};
let colors = {};

/**
 * @method createDimensions
 * Create the defined dimensions from the controller.
 * @return dimensions
 * @private
 */
const createDimensions = () => {
    dimensions = crossfilter(content).dimension(d => d.queue);
};

/**
 * @method createGroups
 * Create the defined groups from the controller.
 * @return groups
 * @private
 */
const createGroups = () => {
    const groupNames = ['interactions'];
    groups = groupNames.map(name => dimensions.group().reduceCount(item => item[name]));
};

/**
 * @method setColors
 * Set the row colors in the chart.
 * @return colors
 * @private
 */
const setColors = () => {
    colors = ['#607D8B'];
};

createDimensions();
createGroups();
setColors();
