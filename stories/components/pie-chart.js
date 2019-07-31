import hbs from 'htmlbars-inline-precompile';
import crossfilter from 'crossfilter';
import content from '../content/pie-chart-data.json';

export const pieChartConfigOptions = () => {
    return {
        template: hbs`
        {{pie-chart
            dimension=dimension
            group=group
            colors=colors
            colorMap=colorMap
            height=height
            width=width
            showTotal=true
            donutChart=false
            externalLabels=false
            labels=true
            labelsWithValues=false
            showLegend=true
            legendWidth=200
        }}`,
        context: {
            dimension: dimensions,
            group: groups,
            type: 'GROUPED',
            colors,
            colorMap,
            height: 800,
            width: 800
        }
    };
};

let dimensions = {};
let groups = {};
const colors = [
    '#607D8B',
    '#00796B',
    '#0097A7',
    '#303F9F'];

const colorMap = ['Available', 'Busy', 'Away', 'On Queue'];
/**
 * @method createDimensions
 * Create the defined dimensions from the controller.
 * @return dimensions
 * @private
 */
const createDimensions = () => {
    dimensions = crossfilter(content).dimension(d => d.status);
};

/**
 * @method createGroups
 * Create the defined groups from the controller.
 * @return groups
 * @private
 */
const createGroups = () => {
    groups = dimensions.group().reduceCount(d => d.status);
};

createDimensions();
createGroups();