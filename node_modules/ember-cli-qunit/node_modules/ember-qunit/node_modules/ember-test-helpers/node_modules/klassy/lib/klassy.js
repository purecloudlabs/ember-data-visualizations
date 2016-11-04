/**
 Extend a class with the properties and methods of one or more other classes.

 When a method is replaced with another method, it will be wrapped in a
 function that makes the replaced method accessible via `this._super`.

 @method extendClass
 @param {Object} destination The class to merge into
 @param {Object} source One or more source classes
 */
var extendClass = function(destination) {
  var sources = Array.prototype.slice.call(arguments, 1);
  var source;

  for (var i = 0, l = sources.length; i < l; i++) {
    source = sources[i];

    for (var p in source) {
      if (source.hasOwnProperty(p) &&
        destination[p] &&
        typeof destination[p] === 'function' &&
        typeof source[p] === 'function') {

        /* jshint loopfunc:true */
        destination[p] =
          (function(destinationFn, sourceFn) {
            var wrapper = function() {
              var prevSuper = this._super;
              this._super = destinationFn;

              var ret = sourceFn.apply(this, arguments);

              this._super = prevSuper;

              return ret;
            };
            wrapper.wrappedFunction = sourceFn;
            return wrapper;
          })(destination[p], source[p]);

      } else {
        destination[p] = source[p];
      }
    }
  }
};

// `subclassing` is a state flag used by `defineClass` to track when a class is
// being subclassed. It allows constructors to avoid calling `init`, which can
// be expensive and cause undesirable side effects.
var subclassing = false;

/**
 Define a new class with the properties and methods of one or more other classes.

 The new class can be based on a `SuperClass`, which will be inserted into its
 prototype chain.

 Furthermore, one or more mixins (object that contain properties and/or methods)
 may be specified, which will be applied in order. When a method is replaced
 with another method, it will be wrapped in a function that makes the previous
 method accessible via `this._super`.

 @method defineClass
 @param {Object} SuperClass A base class to extend. If `mixins` are to be included
 without a `SuperClass`, pass `null` for SuperClass.
 @param {Object} mixins One or more objects that contain properties and methods
 to apply to the new class.
 */
var defineClass = function(SuperClass) {
  var Klass = function() {
    if (!subclassing && this.init) {
      this.init.apply(this, arguments);
    }
  };

  if (SuperClass) {
    subclassing = true;
    Klass.prototype = new SuperClass();
    subclassing = false;
  }

  if (arguments.length > 1) {
    var extendArgs = Array.prototype.slice.call(arguments, 1);
    extendArgs.unshift(Klass.prototype);
    extendClass.apply(Klass.prototype, extendArgs);
  }

  Klass.constructor = Klass;

  Klass.extend = function() {
    var args = Array.prototype.slice.call(arguments, 0);
    args.unshift(Klass);
    return defineClass.apply(Klass, args);
  };

  return Klass;
};

/**
 A base class that can be extended.

 @example

 ```javascript
 var CelestialObject = Klass.extend({
   init: function(name) {
     this._super();
     this.name = name;
     this.isCelestialObject = true;
   },
   greeting: function() {
     return 'Hello from ' + this.name;
   }
 });

 var Planet = CelestialObject.extend({
   init: function(name) {
     this._super.apply(this, arguments);
     this.isPlanet = true;
   },
   greeting: function() {
     return this._super() + '!';
   },
 });

 var earth = new Planet('Earth');

 console.log(earth instanceof Klass);           // true
 console.log(earth instanceof CelestialObject); // true
 console.log(earth instanceof Planet);          // true

 console.log(earth.isCelestialObject);          // true
 console.log(earth.isPlanet);                   // true

 console.log(earth.greeting());                 // 'Hello from Earth!'
 ```

 @class Klass
 */
var Klass = defineClass(null, {
  init: function() {}
});

export { Klass, defineClass, extendClass };
