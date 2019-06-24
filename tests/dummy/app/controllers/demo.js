import { get } from '@ember/object';
import Controller from '@ember/controller';
import moment from 'moment';
import d3 from 'd3';
import crossfilter from 'crossfilter';
import { computed } from '@ember/object';

export default Controller.extend({
    metrics: [
        { value: 'sighting', label: 'Sightings' }
    ],
    showCollisionDemo: false,
    actions: {
        increaseData() {
            let content = get(this, 'content');
            content[5].calls += 15;
            content[5].chats += 15;
            content[5].emails += 15;
            this.set('content', content);
            this._createDimensions();
            this._createGroups();
        },
        decreaseData() {
            let content = get(this, 'content');
            content[5].calls -= 15;
            content[5].chats -= 15;
            content[5].emails -= 15;
            this.set('content', content);
            this._createDimensions();
            this._createGroups();
        },
        increaseQueue() {
            let content = get(this, 'queueContent');

            content.push({ 'queue': 'IT' });
            content.push({ 'queue': 'Manufacturing' });
            content.push({ 'queue': 'Sales' });
            content.push({ 'queue': 'Support' });

            this.set('queueContent', content);
            this._createQueueDimensions();
            this._createQueueGroups();
        },
        decreaseQueue() {
            let content = get(this, 'queueContent');
            content.pop();
            content.pop();
            content.pop();
            content.pop();

            this.set('queueContent', content);
            this._createQueueDimensions();
            this._createQueueGroups();
        },
        doCollision(value) {
            let data = [];
            switch (value) {
                case 'regLabelOverlappingMaxLabelLeft': {
                    data = this.get('content').map(d => {
                        d.calls = 100;
                        return d;
                    });
                    data[18].calls  = 100.515151515151515151;
                    break;
                }
                case 'regLabelNotOverlappingMaxLabelLeft': {
                    data = this.get('content').map(d => {
                        d.calls = 100;
                        return d;
                    });
                    break;
                }
                case 'maxLabelOverlappingRegLabelLeft': {
                    data = this.get('content').map(d => {
                        d.calls = 100;
                        return d;
                    });
                    data[19].calls  = 100.515151515151515151;
                    break;
                }
                case 'maxLabelNotOverlappingRegLabelLeft': {
                    data = this.get('content').map(d => {
                        d.calls = 100;
                        return d;
                    });
                    data[20].calls  = 100.1155225544522;
                    break;
                }
                case 'minMaxOverlap': {
                    data = this.get('content').map(d => {
                        d.calls = 100;
                        return d;
                    });
                    data[4].calls  = 99.323232323232;
                    data[5].calls  = 201;
                    break;
                }
                default: {
                    data = JSON.parse(this.data);
                }
            }
            this.set('content', data);
            this._createDimensions();
            this._createGroups();
        },
        toggleCollisionResolution() {
            this.toggleProperty('showCollisionDemo');
        }
    },
    labelOptions: computed('showCollisionDemo', function () {
        return {
            showMaxMin: true,
            showDataValues: true,
            labelCollisionResolution: this.get('showCollisionDemo') ? 'auto' : 'default'
        };
    }),

    dimensions: [],
    domainString: '',
    groups: [],
    minBoxWidth: 4,
    keyFormat: key => moment(key.toString()).format('MMM DD'),

    // color stuff
    heatColors: ['#203B73', '#75A8FF', '#8452CF', '#1DA8B3', '#B5B5EB', '#CC3EBE', '#5E5782', '#FF8FDD', '#868C1E', '#DDD933'],
    colors: ['#B9B9B9', '#A0C0CF', '#105470', '#FF0000', '#0f9b22'],
    statusColors: [
        '#7ADB37', // available
        '#FC0D1C', // busy
        '#FDBA43', // away
        '#2FCEF5'], // on queue
    colorMap: ['Available', 'Busy', 'Away', 'On Queue'],

    // axes
    xAxis: {
        domain: [moment('10/31/2016'), moment('12/03/2016')],
        ticks: 3,
        tickMarks: 3,
        label: 'Time (Interval)'
    },
    yAxis: {
        ticks: 3,
        label: 'Queues'
    },

    currentInterval: { start: moment('12/02/2016') },

    comparisonLines:
        [{ value: 75, displayValue: '75', color: '#FF0000', alert: 'above', alertColorIndex: 3 },
            { value: 60, displayValue: '60', color: '#0f9b22', alert: 'below', alertColorIndex: 4 }
        ],

    queueComparisonLine: { value: 225, displayValue: '225', color: '#2CD02C' },

    series: [{ title: 'Skilled Answered Calls', hatch: 'pos' }, { title: 'Answered Calls', hatch: 'neg' }, { title: 'Offered Calls', hatch: false }],
    oneSeries: [{ title: 'Offered Calls', hatch: false }],
    noGroup: [],

    // format object tells the groups function how to interpret the data. Give the name of the property you want to use to assign a value to each bubble
    // e.g. the 'title' property is 'entity' here, which tells the grouping function that the 'entity' property on the data objects should be used for the displayed title on each bubble
    // this isn't strictly necessary but it helps for parameterization of the group.
    _format: {
        title: 'entity', subtitle: 'milliseconds', radius: 'milliseconds', color: 'category'
    },

    radiusFormat: 'milliseconds',

    titleFormatter(agentName) {
        if (typeof agentName === 'string') {
            let names = agentName.split(' ');
            return `${names[0].charAt(0)}${names[1].charAt(0)}`;
        }
        return null;
    },

    // timestamp format function. Takes a timestamp and returns a formatted display for the chart.
    timestampSubtitleFormatter(timestamp) {
        let duration = moment.duration(moment().diff(moment(timestamp)));
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
    },

    // count format function
    countSubtitleFormatter(count) {
        return count.toString();
    },

    // millisecond format function
    msSubtitleFormatter(ms) {
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
    },

    onClick(datum) {
        this.set('domainString', datum.x);
        datum.y++;
    },

    /**
     * @method _createDimensions
     * Create the defined dimensions from the controller.
     * @return {void}
     * @private
     */
    _createDimensions() {
        let content = get(this, 'content');

        content.forEach(function (d) {
            d.date = moment(d.date, 'YYYYMMDD').toDate();
        });
        this.set('dimensions', crossfilter(content).dimension(d => d.date));
    },

    /**
     * @method _createGroups
     * Create the defined groups from the controller.
     * @return {void}
     * @private
     */
    _createGroups() {
        const dimensions = this.get('dimensions');
        // These two blocks of code are a convenient way to switch between proper data for GROUPED vs LAYERED/STACKED type in column chart.
        // For GROUPED, uncomment the bottom line and comment out the top block;
        // for LAYERED or STACKED, uncomment the top block and comment out the bottom line

        // const groupNames = ['calls', 'chats', 'emails'];
        // this.set('groups', groupNames.map(name => dimensions.group().reduceSum(item => item[name])));

        this.set('groups', [dimensions.group().reduceSum(item => item.calls)]);
    },

    init() {
        this._super(...arguments);

        let self = this;
        d3.json('data.json').then(function (json) {
            self.data = JSON.stringify(json);
            self.set('content', json);
            self._createDimensions();
            self._createGroups();
        });

        d3.json('agents.json').then(function (json) {
            self.set('agentContent', json.map(d => { d.status = d.status === 'Available' ? d.status + 'ddddddddddddddddddfjohagafghfa' : d.status; return d}));
            self._createAgentDimensions();
            self._createAgentGroups();
        });

        d3.json('queuedata.json').then(function (json) {
            self.set('queueContent', json);
            self._createQueueDimensions();
            self._createQueueGroups();
        });

        d3.json('heatmapdata.json').then(function (json) {
            self.set('heatContent', json);
            self._createHeatDimensions();
            self._createHeatGroups();
        });
        d3.json('agentStatus.json').then(function (json) {
            self.set('statusContent', json);
            self._createStatusDimension();
            self._createStatusGroup();
        });

        this.set('domainString', `${moment('10/31/2016').toISOString()} - ${moment('12/03/2016').toISOString()}`);
    },

    _createAgentDimensions() {
        let content = get(this, 'agentContent');
        let cf = crossfilter(content);
        this.set('agentDimensions', cf.dimension(d => d.status));
    },

    _createAgentGroups() {
        const dimensions = this.get('agentDimensions');
        this.set('agentGroups', dimensions.group().reduceCount(d => d.status));
    },
    _createQueueDimensions() {
        let content = get(this, 'queueContent');

        if (this._QueueCrossfilter) {
            this._QueueCrossfilter.remove();
            this._QueueCrossfilter.add(content);
        } else {
            this._QueueCrossfilter = crossfilter(content);
        }

        this.set('queueDimensions', this._QueueCrossfilter.dimension(d => d.queue));
    },

    _createQueueGroups() {
        const dimensions = this.get('queueDimensions');
        const groupNames = ['interactions'];
        this.set('queueGroups', groupNames.map(name => dimensions.group().reduceCount(item => item[name])));
    },

    _createHeatDimensions() {
        let content = get(this, 'heatContent');

        if (this._heatCrossfilter) {
            this._heatCrossfilter.remove();
            this._heatCrossfilter.add(content);
        } else {
            this._heatCrossfilter = crossfilter(content);
        }

        this.set('heatDimension', this._heatCrossfilter.dimension(d => [d.queue, d.date]));
    },

    _createHeatGroups() {
        const dimensions = this.get('heatDimension');
        const content = this.get('heatContent');
        let colorsMap = {}, colorsArray = [], j = 0;
        for (let i = 0; i < content.length; i++) {
            let color = content[i].value;
            if (colorsArray.indexOf(color) === -1) {
                colorsArray.push(color);
                colorsMap[color] = j;
                j++;
            }
        }
        this.set('heatColorMap', colorsArray);
        this.set('heatGroup', dimensions.group().reduce(
            (p, v) => {
                return v.value;
            },
            () => { },
            () => ({})
        ));
    },
    _createStatusDimension() {
        let content = get(this, 'statusContent');

        if (this._StatusCrossfilter) {
            this._StatusCrossfilter.remove();
            this._StatusCrossfilter.add(content);
        } else {
            this._StatusCrossfilter = crossfilter(content);
        }

        this.set('statusDimension', this._StatusCrossfilter.dimension(d => d[this._format.title]));
    },

    _createStatusGroup() {
        const dimensions = this.get('statusDimension');

        // status color mapping code
        let colorsMap = { 'Available': 0, 'Busy': 1, 'Away': 2, 'On Queue': 3 };

        let group = dimensions.group().reduce(
            (p, v) => {
                p.radius = v[this._format.radius];
                p.subtitle = v[this._format.subtitle];
                p.tooltip = v[this._format.color];
                p.colorValue = colorsMap[v[this._format.color]];
                return p;
            },
            () => { },
            () => ({})
        );
        this.set('statusGroup', group);
    }
});
