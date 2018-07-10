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

    minBoxWidth: 4,
    keyFormat: key => moment(key.toString()).format('MMM DD'),
    heatColors: ['#203B73', '#75A8FF', '#8452CF', '#1DA8B3', '#B5B5EB', '#CC3EBE', '#5E5782', '#FF8FDD', '#868C1E', '#DDD933'],
    colors: ['#B9B9B9', '#A0C0CF', '#105470'],
    dimensions: [],
    domainString: '',
    groups: [],
    statusColors: [
        '#7ADB37', // available
        '#FC0D1C', // busy
        '#FDBA43', // away
        '#2FCEF5'], // on queue
    colorMap: ['Available', 'Busy', 'Away', 'On Queue'],
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

    comparisonLine: { value: 70, displayValue: '70', color: '#2CD02C' },

    queueComparisonLine: { value: 225, displayValue: '225', color: '#2CD02C' },

    series: [{ title: 'Skilled Answered Calls', hatch: 'pos' }, { title: 'Answered Calls', hatch: 'neg' }, { title: 'Offered Calls', hatch: false }],

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

        d3.json('heatmapdata.json', function (error, json) {
            if (error) {
                return Ember.Logger.log(error);
            }
            self.set('heatContent', json);
            self._createHeatDimensions();
            self._createHeatGroups();
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

    _createHeatDimensions() {
        let content = Ember.get(this, 'heatContent');

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
        this.set('colorMap', colorsArray);
        this.set('heatGroup', dimensions.group().reduce(
            (p, v) => {
                return v.value;
            },
            () => { },
            () => ({})
        ));
    }
});
