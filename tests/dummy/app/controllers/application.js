import Ember from 'ember';
import moment from 'moment';
import d3 from 'd3';
import crossfilter from 'crossfilter';

export default Ember.Controller.extend({
    metrics: [
        { value: 'sighting', label: 'Sightings' }
    ],

    actions: {
        increaseData() {
            let content = Ember.get(this, 'content');
            content[5].calls += 15;
            content[5].chats += 15;
            content[5].emails += 15;
            this.set('content', content);
            this._createDimensions();
            this._createGroups();
        },
        decreaseData() {
            let content = Ember.get(this, 'content');
            content[5].calls -= 15;
            content[5].chats -= 15;
            content[5].emails -= 15;
            this.set('content', content);
            this._createDimensions();
            this._createGroups();
        },
        increaseQueue() {
            let content = Ember.get(this, 'queueContent');

            content.push({ 'queue': 'IT' });
            content.push({ 'queue': 'Manufacturing' });
            content.push({ 'queue': 'Sales' });
            content.push({ 'queue': 'Support' });

            this.set('queueContent', content);
            this._createQueueDimensions();
            this._createQueueGroups();
        },
        decreaseQueue() {
            let content = Ember.get(this, 'queueContent');
            content.pop();
            content.pop();
            content.pop();
            content.pop();

            this.set('queueContent', content);
            this._createQueueDimensions();
            this._createQueueGroups();
        }
    },

    dimensions: [],
    domainString: '',
    groups: [],
    colors: ['#B9B9B9', '#A0C0CF', '#105470'],
    statusColors: [
        '#7ADB37', // available
        '#FC0D1C', // busy
        '#FDBA43', // away
        '#2FCEF5'], // on queue
    colorMap: ['Available', 'Busy', 'Away', 'On Queue'],
    xAxis: {
        domain: [moment('10/31/2016'), moment('12/03/2016')],
        ticks: 5
    },
    yAxis: {
        ticks: 3
    },

    currentInterval: { start: moment('12/02/2016') },

    comparisonLine: { value: 70, displayValue: '70', color: '#2CD02C' },

    queueComparisonLine: { value: 225, displayValue: '225', color: '#2CD02C' },

    series: [{ title: 'Skilled Answered Calls', hatch: 'pos' }, { title: 'Answered Calls', hatch: 'neg' }, { title: 'Offered Calls', hatch: false }],

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
        let content = Ember.get(this, 'content');

        content.forEach(function (d) {
            d.date = moment(d.date, 'YYYYMMDD').toDate();
        });

        if (this._crossfilter) {
            this._crossfilter.remove();
            this._crossfilter.add(content);
        } else {
            this._crossfilter = crossfilter(content);
        }

        this.set('dimensions', this._crossfilter.dimension(d => d.date));
    },

    /**
     * @method _createGroups
     * Create the defined groups from the controller.
     * @return {void}
     * @private
     */
    _createGroups() {
        const dimensions = this.get('dimensions');
        const groupNames = ['calls', 'chats', 'emails'];
        this.set('groups', groupNames.map(name => dimensions.group().reduceSum(item => item[name])));
    },

    init() {
        let self = this;
        d3.json('data.json', function (error, json) {
            if (error) {
                return Ember.Logger.log(error);
            }
            self.set('content', json);
            self._createDimensions();
            self._createGroups();
        });

        d3.json('agents.json', function (error, json) {
            if (error) {
                return Ember.Logger.log(error);
            }
            self.set('agentContent', json);
            self._createAgentDimensions();
            self._createAgentGroups();
        });

        d3.json('queuedata.json', function (error, json) {
            if (error) {
                return Ember.Logger.log(error);
            }
            self.set('queueContent', json);
            self._createQueueDimensions();
            self._createQueueGroups();
        });

        d3.json('agentStatus.json', function (error, json) {
            if (error) {
                return Ember.Logger.log(error);
            }
            self.set('statusContent', json);
            self._createStatusDimension();
            self._createStatusGroup();
        });

        this.set('domainString', `${moment('10/31/2016').toISOString()} - ${moment('12/03/2016').toISOString()}`);
    },

    _createAgentDimensions() {
        let content = Ember.get(this, 'agentContent');
        let cf = crossfilter(content);
        this.set('agentDimensions', cf.dimension(d => d.status));
    },

    _createAgentGroups() {
        const dimensions = this.get('agentDimensions');
        this.set('agentGroups', dimensions.group().reduceCount(d => d.status));
    },
    _createQueueDimensions() {
        let content = Ember.get(this, 'queueContent');

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

    _createStatusDimension() {
        let content = Ember.get(this, 'statusContent');

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

        // generic color mapping code: this is still here for potential future use

        // const content = this.get('statusContent');
        // let colorsMap = {}, colorsArray = [], j = 0;
        // for (let i = 0; i < content.length; i++) {
        //     let color = content[i][this._format.color];
        //     if (colorsArray.indexOf(color) === -1) {
        //         colorsArray.push(color);
        //         colorsMap[color] = j;
        //         j++;
        //     }
        // }

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
