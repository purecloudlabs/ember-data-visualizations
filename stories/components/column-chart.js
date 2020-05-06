import hbs from 'htmlbars-inline-precompile';
import moment from 'moment';
import crossfilter from 'crossfilter';
import columnChartData1 from '../content/column-chart-data-1.json';
import columnChartData2 from '../content/column-chart-data-2.json';

import { computed } from '@ember/object';
import { alias } from '@ember/object/computed';

/**
 * Configure the rendered chart
 *
 * @param {array} dataSet set of objects
 * @example [
 *  { date: '20101101', value: 100 },
 *  { date: '20101201', value: 150 },
 *  { date: '20110101', value: 200 }
 * ]
 * @param {string} type either 'GROUPED' or 'STACKED'
 */
const buildConfigOptions = (dataset, options) => {
    dataset = JSON.parse(JSON.stringify(dataset));

    // combine dataset values together by date
    dataset.forEach(function (d) {
        d.date = moment(d.date, 'YYYYMMDD').toDate();
    });

    const dimension = crossfilter(dataset).dimension(d => d.date);

    // each datum key gets a bar on the bar chart
    // GROUPED = bars side by side, STACKED = bars on top of one another
    const type = options.type || 'GROUPED';

    const groupKeys = dataset.reduce((keys, datum) => {
        const datumKeys = Object.keys(datum).filter(key => key !== 'date');

        datumKeys.forEach(key => {
            if (!keys.includes(key)) {
                keys.push(key);
            }
        });

        return keys;
    }, []);

    const group = groupKeys.map(key => dimension.group().reduceSum(item => item[key] || 0));
    const series = groupKeys.map(key => ({ title: key, hatch: false }));

    const colors = [
        '#3F8BA8', '#a759cd', '#61c049',
        '#F4880B', '#a8b635', '#ca47a0',
        '#4d9234', '#db436b', '#50c3ae',
        '#c54436', '#46aed7', '#e27232',
        '#6e8cd2', '#d29e3a', '#72589c',
        '#aeae63', '#c988d3', '#4a7230',
        '#dd81a0', '#499669', '#9d4667',
        '#297b66', '#df8e6f', '#787228'
    ];

    const startX = dataset.map(d => d.date).reduce((start, time) => start && moment(start).isBefore(time) ? moment(start) : moment(time), null);
    const endX = dataset.map(d => d.date).reduce((end, time) => end && moment(end).isAfter(time) ? moment(end) : moment(time), null);

    const xAxis = {
        domain: [startX, endX],
        ticks: 3,
        tickMarks: 3
    };

    return Object.assign({
        type,
        height: 200,
        group,
        dimension,
        series,
        colors,
        xAxis,
        yAxis: {
            ticks: 3
        },
        legendOptions: {
            showLegend: true,
            position: 'bottom'
        }
    }, options);
};

const initialData = columnChartData1;

export const columnChartConfigOptions = () => {
    return {
        template: hbs`
            <style>
                .chart.column-chart {
                    margin-top: 10px;
                    background-color: antiqueWhite;
                }
            </style>

            <h1>Column Chart</h1>
            <button type='button' onclick={{action applyDataset nextDataset}}>Change dataset</button>
            <button type='button' onclick={{action toggleStacking}}>Toggle Stacking</button>
            <button type='button' onclick={{action toggleLegend}}>Toggle Showing Legend</button>
            <button type='button' onclick={{action toggleLegendPosition}}>Toggle Legend Location</button>
            <button type='button' onclick={{action reset}}>Reset</button>

            {{column-chart 
                dimension=config.dimension
                group=config.group
                type=config.type
                series=config.series
                colors=config.colors
                height=config.height
                legendOptions=config.legendOptions
                xAxis=config.xAxis
                yAxis=config.yAxis
            }}
        `,
        context: {
            dataset: initialData,
            nextDataset: columnChartData2,

            overrides: {},

            _legendOptions: alias('config.legendOptions'),
            _legendOverrides: alias('overrides.legendOptions'),

            config: computed('dataset', 'overrides.{type,legendOptions}', '_legendOptions.{showLegend,shouldAppendLegendBelow}', '_legendOverrides.{showLegend,shouldAppendLegendBelow}', function () {
                const dataset = this.get('dataset');
                const overrides = this.get('overrides');

                return buildConfigOptions(dataset, overrides);
            }),

            reset() {
                this.set('overrides', {});
                this.set('dataset', initialData);
            },

            applyDataset(dataset) {
                const currentDataset = this.get('dataset');
                this.set('dataset', dataset);

                if (dataset !== currentDataset) {
                    this.set('nextDataset', currentDataset);
                }
            },

            toggleLegend() {
                const legendOptions = this.get('_legendOptions');
                const legendOverrides = this.get('_legendOverrides');

                const showLegend = legendOptions.showLegend;
                const updatedOverrides = Object.assign({}, legendOptions, legendOverrides, { showLegend: !showLegend });

                this.set('_legendOverrides', updatedOverrides);
            },

            toggleLegendPosition() {
                const legendOptions = this.get('_legendOptions');
                const legendOverrides = this.get('_legendOverrides');

                const showLegend = legendOptions.showLegend;
                const position = legendOptions.position === 'bottom' ? 'right' : 'bottom';
                const updatedOverrides = Object.assign({}, legendOptions, legendOverrides, { position });

                if (showLegend) {
                    this.set('_legendOverrides', updatedOverrides);
                }
            },

            toggleStacking() {
                const isStacking = this.get('config.type') === 'STACKED';
                this.set('overrides.type', isStacking ? 'GROUPED' : 'STACKED');
            }
        }
    };
};
