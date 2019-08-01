import hbs from 'htmlbars-inline-precompile';
import moment from 'moment';
import crossfilter from 'crossfilter';
import content from '../content/heat-map-chart-data.json';

export const heatMapChartConfigOptions = () => {
    return {
        template: hbs`
        {{heat-map
            dimension=dimension
            group=group
            legendWidth=200
            height=height
            keyFormat=keyFormat
            colors=colors
            colorMap=colorMap
            xAxis=xAxis
            yAxis=yAxis
            currentInterval=currentInterval
            showCurrentIndicator=true
        }}`,
        context: {
            dimension: dimensions,
            group: groups,
            type: 'GROUPED',
            colors,
            colorMap,
            height: 400,
            currentInterval: { start: moment('12/02/2016') },
            keyFormat: key => moment(key.toString()).format('MMM DD'),
            xAxis: {
                domain: [moment('2016-10-31T00:00:00.000Z'), moment('2016-12-03T00:00:00.000Z')],
                ticks: 3,
                tickMarks: 3
            },
            yAxis: {
                ticks: 3
            }
        }
    };
};

let dimensions = {};
let groups = {};
let colorMap = {};
const colors = ['#203B73', '#75A8FF', '#8452CF', '#1DA8B3', '#B5B5EB', '#CC3EBE', '#5E5782', '#FF8FDD', '#868C1E', '#DDD933'];

/**
 * @method createDimensions
 * Create the defined dimensions from the controller.
 * @return dimensions
 * @private
 */
const createDimensions = () => {
    dimensions = crossfilter(content).dimension(d => [d.queue, d.date]);
};

/**
 * @method createGroups
 * Create the defined groups from the controller.
 * @return groups
 * @private
 */
const createGroups = () => {
    groups = dimensions.group().reduce(
        (p, v) => {
            return v.value;
        },
        () => { },
        () => ({})
    );
};

/**
 * @method setColors
 * Set the heatmap colors in the chart.
 * @return colors
 * @private
 */
const setColors = () => {
    let colorsMap = {}, colorsArray = [], j = 0;
    for (let i = 0; i < content.length; i++) {
        let color = content[i].value;
        if (colorsArray.indexOf(color) === -1) {
            colorsArray.push(color);
            colorsMap[color] = j;
            j++;
        }
    }
    colorMap = colorsArray;
};

createDimensions();
createGroups();
setColors();
