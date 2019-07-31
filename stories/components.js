/* eslint-env node */
import { storiesOf } from '@storybook/ember';
import { columnChartConfigOptions } from './components/column-chart';
import { pieChartConfigOptions } from './components/pie-chart';
import { lineChartConfigOptions } from './components/line-chart';
import { rowChartConfigOptions } from './components/row-chart';
import { bubbleChartConfigOptions } from './components/bubble-chart';
import { heatMapChartConfigOptions } from './components/heat-map-chart';

const initializeStories = () => {
    storiesOf('Components', module)
        .add('Column Chart', columnChartConfigOptions)
        .add('Pie Chart', pieChartConfigOptions)
        .add('Line Chart', lineChartConfigOptions)
        .add('Row Chart', rowChartConfigOptions)
        .add('Bubble Chart', bubbleChartConfigOptions)
        .add('Heatmap Chart', heatMapChartConfigOptions);
};

initializeStories();