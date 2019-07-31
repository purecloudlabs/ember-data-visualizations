import hbs from 'htmlbars-inline-precompile';
import moment from 'moment';
import crossfilter from 'crossfilter';
import content from '../content/bubble-chart-data.json';

export const bubbleChartConfigOptions = () => {
    return {
        template: hbs`
        {{bubble-chart
            dimension=dimension
            group=group
            radiusFormat=radiusFormat
            height=height
            titleFormatter=titleFormatter
            subtitleFormatter=msSubtitleFormatter
            colors=colors
            showLegend=false
            legendWidth=200
        }}`,
        context: {
            dimension: dimensions,
            group: groups,
            type: 'GROUPED',
            series: [{ title: 'Offered Calls', hatch: false }],
            colors,
            height: 800,
            radiusFormat,
            titleFormatter,
            msSubtitleFormatter,
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
const colors = [
    '#dd2c00',
    '#00c853',
    '#0091ea',
    '#c51162'];

const radiusFormat = 'milliseconds';

const titleFormatter = agentName => {
    if (typeof agentName === 'string') {
        let names = agentName.split(' ');
        return `${names[0]} ${names[1].charAt(0)}`;
    }
    return null;
};

const msSubtitleFormatter = ms => {
    let duration = moment.duration(ms);
    let str = '';
    if (duration.days() !== 0) {
        str = str.concat(`${duration.days()} `);
        let qualifier = duration.days() === 1 ? 'day ' : 'days ';
        str = str.concat(qualifier);
    }
    if (duration.hours() !== 0) {
        str = str.concat(`${duration.hours()}h `);
    }
    if (duration.minutes() !== 0) {
        str = str.concat(`${duration.minutes()}m `);
    }
    if (duration.seconds() !== 0) {
        str = str.concat(`${duration.seconds()}s`);
    }
    return str;
};

// format object tells the groups function how to interpret the data. Give the name of the property you want to use to assign a value to each bubble
// e.g. the 'title' property is 'entity' here, which tells the grouping function that the 'entity' property on the data objects should be used for the displayed title on each bubble
// this isn't strictly necessary but it helps for parameterization of the group.
const _format = {
    title: 'entity', subtitle: 'milliseconds', radius: 'milliseconds', color: 'category'
};

/**
 * @method createDimensions
 * Create the defined dimensions from the controller.
 * @return dimensions
 * @private
 */
const createDimensions = () => {
    dimensions = crossfilter(content).dimension(d => d[_format.title]);
};

/**
 * @method createGroups
 * Create the defined groups from the controller.
 * @return groups
 * @private
 */
const createGroups = () => {
    // status color mapping code
    let colorsMap = { 'Available': 0, 'Busy': 1, 'Away': 2, 'On Queue': 3 };

    groups = dimensions.group().reduce(
        (p, v) => {
            p.radius = v[_format.radius];
            p.subtitle = v[_format.subtitle];
            p.tooltip = v[_format.color];
            p.colorValue = colorsMap[v[_format.color]];
            return p;
        },
        () => { },
        () => ({})
    );
};

createDimensions();
createGroups();
