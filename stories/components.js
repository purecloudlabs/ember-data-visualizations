/* eslint-env node */
import hbs from 'htmlbars-inline-precompile';
import { storiesOf } from '@storybook/ember';
import moment from 'moment';
import crossfilter from 'crossfilter';
import content from './content.json';
import { action } from '@storybook/addon-actions';

const initializeStories = () => {
    storiesOf('Components', module)
        .add('Column Chart', () => {
            return {
                template: hbs`
                {{column-chart 
                    dimension=dimension
                    group=group
                    type=type
                    series=series
                    colors=colors
                    height=height
                    xAxis=xAxis
                    yAxis=yAxis
                    click=(action onClick)
                }}`,
                context: {
                    dimension: dimensions,
                    group: groups,
                    type: 'GROUPED',
                    series: [{ title: 'Offered Calls', hatch: false }],
                    colors,
                    height: 200,
                    xAxis: {
                        domain: [moment('10/31/2016'), moment('12/03/2016')],
                        ticks: 3,
                        tickMarks: 3
                    },
                    yAxis: {
                        ticks: 3
                    },
                    onClick: action('clicked')
                }
            };
        });
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
    content.forEach(function (d) {
        d.date = moment(d.date, 'YYYYMMDD').toDate();
    });

    dimensions = crossfilter(content).dimension(d => d.date);
};

/**
 * @method createGroups
 * Create the defined groups from the controller.
 * @return groups
 * @private
 */
const createGroups = () => {
    groups = [dimensions.group().reduceSum(item => item.calls)];
};

/**
 * @method setColors
 * Set the column colors in the chart.
 * @return colors
 * @private
 */
const setColors = () => {
    colors = ['#2FCEF5'];
};

createDimensions();
createGroups();
setColors();
initializeStories();