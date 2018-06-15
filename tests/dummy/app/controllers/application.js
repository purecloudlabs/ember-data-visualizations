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
        }
    },

    dimensions: [],
    domainString: '',
    groups: [],
    colors: ['#B9B9B9', '#A0C0CF', '#105470'],
    xAxis: {
        domain: [moment('10/31/2016'), moment('12/03/2016')],
        ticks: 5
    },
    yAxis: {
        ticks: 3
    },

    currentInterval: { start: moment('12/02/2016') },

    comparisonLine: { value: 70, displayValue: '70', color: '#2CD02C' },

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

        d3.json('queuedata.json', function (error, json) {
            if (error) {
                return Ember.Logger.log(error);
            }
            self.set('queueContent', json);
            self._createQueueDimensions();
            self._createQueueGroups();
        });

        this.set('domainString', `${moment('10/31/2016').toISOString()} - ${moment('12/03/2016').toISOString()}`);
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
    }
});
