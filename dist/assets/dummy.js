"use strict";

/* jshint ignore:start */



/* jshint ignore:end */

define('dummy/app', ['exports', 'ember', 'dummy/resolver', 'ember-load-initializers', 'dummy/config/environment'], function (exports, _ember, _dummyResolver, _emberLoadInitializers, _dummyConfigEnvironment) {

  var App = undefined;

  _ember['default'].MODEL_FACTORY_INJECTIONS = true;

  App = _ember['default'].Application.extend({
    modulePrefix: _dummyConfigEnvironment['default'].modulePrefix,
    podModulePrefix: _dummyConfigEnvironment['default'].podModulePrefix,
    Resolver: _dummyResolver['default']
  });

  (0, _emberLoadInitializers['default'])(App, _dummyConfigEnvironment['default'].modulePrefix);

  exports['default'] = App;
});
define('dummy/components/app-version', ['exports', 'ember-cli-app-version/components/app-version', 'dummy/config/environment'], function (exports, _emberCliAppVersionComponentsAppVersion, _dummyConfigEnvironment) {

  var name = _dummyConfigEnvironment['default'].APP.name;
  var version = _dummyConfigEnvironment['default'].APP.version;

  exports['default'] = _emberCliAppVersionComponentsAppVersion['default'].extend({
    version: version,
    name: name
  });
});
define('dummy/components/column-chart/component', ['exports', 'ember-data-visualizations/components/column-chart/component'], function (exports, _emberDataVisualizationsComponentsColumnChartComponent) {
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function get() {
      return _emberDataVisualizationsComponentsColumnChartComponent['default'];
    }
  });
});
define('dummy/components/ember-tether', ['exports', 'ember-tether/components/ember-tether'], function (exports, _emberTetherComponentsEmberTether) {
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function get() {
      return _emberTetherComponentsEmberTether['default'];
    }
  });
});
define('dummy/controllers/application', ['exports', 'ember'], function (exports, _ember) {
    exports['default'] = _ember['default'].Controller.extend({
        metrics: [{ value: 'sighting', label: 'Sightings' }],

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

        onClick: function onClick(datum) {
            this.set('domainString', datum.x);
        },

        /**
         * @method _createDimensions
         * Create the defined dimensions from the controller.
         * @return {void}
         * @private
         */
        _createDimensions: function _createDimensions() {
            var content = _ember['default'].get(this, 'content');

            content.forEach(function (d) {
                d.date = moment(d.date, 'YYYYMMDD').toDate();
            });

            this._crossfilter = crossfilter(content);

            this.set('dimensions', this._crossfilter.dimension(function (d) {
                return d.date;
            }));
        },

        /**
         * @method _createGroups
         * Create the defined groups from the controller.
         * @return {void}
         * @private
         */
        _createGroups: function _createGroups() {
            var groups = [];
            var dim = this.get('dimensions');

            var createAddDataFunc = function createAddDataFunc(key) {
                return function () {
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

        init: function init() {
            // this.set('content', {});
            var self = this;
            d3.json("data.json", function (error, json) {
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
});
/* global moment, d3, crossfilter */
define('dummy/controllers/array', ['exports', 'ember'], function (exports, _ember) {
  exports['default'] = _ember['default'].Controller;
});
define('dummy/controllers/object', ['exports', 'ember'], function (exports, _ember) {
  exports['default'] = _ember['default'].Controller;
});
define('dummy/helpers/pluralize', ['exports', 'ember-inflector/lib/helpers/pluralize'], function (exports, _emberInflectorLibHelpersPluralize) {
  exports['default'] = _emberInflectorLibHelpersPluralize['default'];
});
define('dummy/helpers/singularize', ['exports', 'ember-inflector/lib/helpers/singularize'], function (exports, _emberInflectorLibHelpersSingularize) {
  exports['default'] = _emberInflectorLibHelpersSingularize['default'];
});
define('dummy/initializers/app-version', ['exports', 'ember-cli-app-version/initializer-factory', 'dummy/config/environment'], function (exports, _emberCliAppVersionInitializerFactory, _dummyConfigEnvironment) {
  exports['default'] = {
    name: 'App Version',
    initialize: (0, _emberCliAppVersionInitializerFactory['default'])(_dummyConfigEnvironment['default'].APP.name, _dummyConfigEnvironment['default'].APP.version)
  };
});
define('dummy/initializers/container-debug-adapter', ['exports', 'ember-resolver/container-debug-adapter'], function (exports, _emberResolverContainerDebugAdapter) {
  exports['default'] = {
    name: 'container-debug-adapter',

    initialize: function initialize() {
      var app = arguments[1] || arguments[0];

      app.register('container-debug-adapter:main', _emberResolverContainerDebugAdapter['default']);
      app.inject('container-debug-adapter:main', 'namespace', 'application:main');
    }
  };
});
define('dummy/initializers/data-adapter', ['exports', 'ember'], function (exports, _ember) {

  /*
    This initializer is here to keep backwards compatibility with code depending
    on the `data-adapter` initializer (before Ember Data was an addon).
  
    Should be removed for Ember Data 3.x
  */

  exports['default'] = {
    name: 'data-adapter',
    before: 'store',
    initialize: _ember['default'].K
  };
});
define('dummy/initializers/ember-data', ['exports', 'ember-data/setup-container', 'ember-data/-private/core'], function (exports, _emberDataSetupContainer, _emberDataPrivateCore) {

  /*
  
    This code initializes Ember-Data onto an Ember application.
  
    If an Ember.js developer defines a subclass of DS.Store on their application,
    as `App.StoreService` (or via a module system that resolves to `service:store`)
    this code will automatically instantiate it and make it available on the
    router.
  
    Additionally, after an application's controllers have been injected, they will
    each have the store made available to them.
  
    For example, imagine an Ember.js application with the following classes:
  
    App.StoreService = DS.Store.extend({
      adapter: 'custom'
    });
  
    App.PostsController = Ember.Controller.extend({
      // ...
    });
  
    When the application is initialized, `App.ApplicationStore` will automatically be
    instantiated, and the instance of `App.PostsController` will have its `store`
    property set to that instance.
  
    Note that this code will only be run if the `ember-application` package is
    loaded. If Ember Data is being used in an environment other than a
    typical application (e.g., node.js where only `ember-runtime` is available),
    this code will be ignored.
  */

  exports['default'] = {
    name: 'ember-data',
    initialize: _emberDataSetupContainer['default']
  };
});
define('dummy/initializers/export-application-global', ['exports', 'ember', 'dummy/config/environment'], function (exports, _ember, _dummyConfigEnvironment) {
  exports.initialize = initialize;

  function initialize() {
    var application = arguments[1] || arguments[0];
    if (_dummyConfigEnvironment['default'].exportApplicationGlobal !== false) {
      var theGlobal;
      if (typeof window !== 'undefined') {
        theGlobal = window;
      } else if (typeof global !== 'undefined') {
        theGlobal = global;
      } else if (typeof self !== 'undefined') {
        theGlobal = self;
      } else {
        // no reasonable global, just bail
        return;
      }

      var value = _dummyConfigEnvironment['default'].exportApplicationGlobal;
      var globalName;

      if (typeof value === 'string') {
        globalName = value;
      } else {
        globalName = _ember['default'].String.classify(_dummyConfigEnvironment['default'].modulePrefix);
      }

      if (!theGlobal[globalName]) {
        theGlobal[globalName] = application;

        application.reopen({
          willDestroy: function willDestroy() {
            this._super.apply(this, arguments);
            delete theGlobal[globalName];
          }
        });
      }
    }
  }

  exports['default'] = {
    name: 'export-application-global',

    initialize: initialize
  };
});
define('dummy/initializers/injectStore', ['exports', 'ember'], function (exports, _ember) {

  /*
    This initializer is here to keep backwards compatibility with code depending
    on the `injectStore` initializer (before Ember Data was an addon).
  
    Should be removed for Ember Data 3.x
  */

  exports['default'] = {
    name: 'injectStore',
    before: 'store',
    initialize: _ember['default'].K
  };
});
define('dummy/initializers/store', ['exports', 'ember'], function (exports, _ember) {

  /*
    This initializer is here to keep backwards compatibility with code depending
    on the `store` initializer (before Ember Data was an addon).
  
    Should be removed for Ember Data 3.x
  */

  exports['default'] = {
    name: 'store',
    after: 'ember-data',
    initialize: _ember['default'].K
  };
});
define('dummy/initializers/transforms', ['exports', 'ember'], function (exports, _ember) {

  /*
    This initializer is here to keep backwards compatibility with code depending
    on the `transforms` initializer (before Ember Data was an addon).
  
    Should be removed for Ember Data 3.x
  */

  exports['default'] = {
    name: 'transforms',
    before: 'store',
    initialize: _ember['default'].K
  };
});
define("dummy/instance-initializers/ember-data", ["exports", "ember-data/-private/instance-initializers/initialize-store-service"], function (exports, _emberDataPrivateInstanceInitializersInitializeStoreService) {
  exports["default"] = {
    name: "ember-data",
    initialize: _emberDataPrivateInstanceInitializersInitializeStoreService["default"]
  };
});
define('dummy/resolver', ['exports', 'ember-resolver'], function (exports, _emberResolver) {
  exports['default'] = _emberResolver['default'];
});
define('dummy/router', ['exports', 'ember', 'dummy/config/environment'], function (exports, _ember, _dummyConfigEnvironment) {

  var Router = _ember['default'].Router.extend({
    location: _dummyConfigEnvironment['default'].locationType
  });

  Router.map(function () {});

  exports['default'] = Router;
});
define('dummy/services/ajax', ['exports', 'ember-ajax/services/ajax'], function (exports, _emberAjaxServicesAjax) {
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function get() {
      return _emberAjaxServicesAjax['default'];
    }
  });
});
define("dummy/templates/application", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    return {
      meta: {
        "fragmentReason": {
          "name": "missing-wrapper",
          "problems": ["wrong-type", "multiple-nodes"]
        },
        "revision": "Ember@2.4.6",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 19,
            "column": 0
          }
        },
        "moduleName": "dummy/templates/application.hbs"
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var morphs = new Array(3);
        morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
        morphs[1] = dom.createMorphAt(fragment, 2, 2, contextualElement);
        morphs[2] = dom.createMorphAt(fragment, 4, 4, contextualElement);
        dom.insertBoundary(fragment, 0);
        return morphs;
      },
      statements: [["content", "domainString", ["loc", [null, [1, 0], [1, 16]]]], ["inline", "column-chart", [], ["dimension", ["subexpr", "@mut", [["get", "dimensions", ["loc", [null, [4, 14], [4, 24]]]]], [], []], "group", ["subexpr", "@mut", [["get", "groups", ["loc", [null, [5, 10], [5, 16]]]]], [], []], "seriesData", ["subexpr", "@mut", [["get", "content", ["loc", [null, [6, 15], [6, 22]]]]], [], []], "type", "LAYERED", "seriesMaxMin", 2, "showMaxMin", true, "series", ["subexpr", "@mut", [["get", "series", ["loc", [null, [10, 11], [10, 17]]]]], [], []], "colors", ["subexpr", "@mut", [["get", "colors", ["loc", [null, [11, 11], [11, 17]]]]], [], []], "height", 200, "xAxis", ["subexpr", "@mut", [["get", "xAxis", ["loc", [null, [13, 10], [13, 15]]]]], [], []], "yAxis", ["subexpr", "@mut", [["get", "yAxis", ["loc", [null, [14, 10], [14, 15]]]]], [], []], "onClick", ["subexpr", "action", [["get", "onClick", ["loc", [null, [15, 20], [15, 27]]]]], [], ["loc", [null, [15, 12], [15, 28]]]]], ["loc", [null, [3, 0], [16, 2]]]], ["content", "outlet", ["loc", [null, [18, 0], [18, 10]]]]],
      locals: [],
      templates: []
    };
  })());
});
/* jshint ignore:start */



/* jshint ignore:end */

/* jshint ignore:start */

define('dummy/config/environment', ['ember'], function(Ember) {
  var prefix = 'dummy';
/* jshint ignore:start */

try {
  var metaName = prefix + '/config/environment';
  var rawConfig = Ember['default'].$('meta[name="' + metaName + '"]').attr('content');
  var config = JSON.parse(unescape(rawConfig));

  return { 'default': config };
}
catch(err) {
  throw new Error('Could not read config from meta tag with name "' + metaName + '".');
}

/* jshint ignore:end */

});

/* jshint ignore:end */

/* jshint ignore:start */

if (!runningTests) {
  require("dummy/app")["default"].create({"name":"ember-data-visualizations","version":"0.0.1+6b33ce8c"});
}

/* jshint ignore:end */
//# sourceMappingURL=dummy.map
