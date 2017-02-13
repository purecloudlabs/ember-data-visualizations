/* global moment, d3, crossfilter */

import Ember from 'ember';

export default Ember.Controller.extend({
    metrics: [
    {value:'sighting', label: 'Sightings'}
  ],
  
  dimensions: [],
  domainString: '',
  groups: [],
  colors: ['#B9B9B9', '#A0C0CF', '#105470'],
  xAxis: {
      domain: [moment("10/31/2016"), moment("12/03/2016")],
      ticks: 5
  },
  yAxis: {
      ticks: 3
  },

  series: [{ title: 'Skilled Answered Calls', hatch: 'pos' }, { title: 'Answered Calls', hatch: 'neg' }, { title: 'Offered Calls', hatch: false }],

  onClick: function (datum) {
      this.set('domainString', datum.x);
  },

  /**
   * @method _createDimensions
   * Create the defined dimensions from the controller.
   * @return {void}
   * @private
   */
  _createDimensions: function() {
    var content = Ember.get(this, 'content');

    content.forEach(function(d) {
      d.date = moment(d.date, 'YYYYMMDD').toDate();
    });

    this._crossfilter = crossfilter(content);

    this.set('dimensions', this._crossfilter.dimension(function(d) { return d.date; }));
  },


  /**
   * @method _createGroups
   * Create the defined groups from the controller.
   * @return {void}
   * @private
   */
  _createGroups: function() {
    var groups = [];
    var dim = this.get('dimensions');

    var createAddDataFunc = function(key) {
        return function() {
            var grouping = dim.group().reduceSum(function (d) {
                return d[key];
            });
            groups.push(grouping);
        };
    };

    createAddDataFunc('calls')();
    createAddDataFunc('chats')();
    createAddDataFunc('emails')();

    this.set('groups', groups);

    // Ember.run.later(this, (function() {
    //     var groups = [];
    //     var dim = this.get('dimensions');

    //     var createAddDataFunc = function(key) {
    //         return function() {
    //             var grouping = dim.group().reduceSum(function (d) {
    //                 return d[key] * 2;
    //             });
    //             groups.push(grouping);
    //         };
    //     };

    //     createAddDataFunc('calls')();
    //     createAddDataFunc('chats')();
    //     createAddDataFunc('emails')();

    //     this.set('groups', groups);

    //     Ember.run.later(this, (function() {
    //       var groups = [];
    //       var dim = this.get('dimensions');

    //       var createAddDataFunc = function(key) {
    //           return function() {
    //               var grouping = dim.group().reduceSum(function (d) {
    //                   return d[key] * 3;
    //               });
    //               groups.push(grouping);
    //           };
    //       };

    //       createAddDataFunc('calls')();
    //       createAddDataFunc('chats')();
    //       createAddDataFunc('emails')();

    //       this.set('groups', groups);

    //       Ember.run.later(this, (function() {
    //         var groups = [];
    //         var dim = this.get('dimensions');

    //         var createAddDataFunc = function(key) {
    //             return function() {
    //                 var grouping = dim.group().reduceSum(function (d) {
    //                     return d[key];
    //                 });
    //                 groups.push(grouping);
    //             };
    //         };

    //         createAddDataFunc('calls')();
    //         createAddDataFunc('chats')();
    //         createAddDataFunc('emails')();

    //         this.set('groups', groups);
            
    //     }), 10000);
          
    //   }), 10000);        

    // }), 10000);
  },

  init: function() {
      // this.set('content', {});
    var self = this;
    d3.json("data.json", function(error, json) {
      if (error) {
        return console.log(error);
      } 
      self.set('content', json);
      self._createDimensions();
      self._createGroups();
    });

    this.set('domainString', moment("10/31/2016").toISOString() + ' - ' + moment("12/03/2016").toISOString());
  }
});
