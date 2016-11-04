# Klassy.js

A class system for JavaScript featuring mixins, constructors, and superclass access.

Extracted from [Orbit.js](https://github.com/orbitjs/orbit.js).

## Usage

Either define your own base class with `defineClass` or use the built-in
base class `Klass`.

Any classes can be extended via the `extend` method.

### Klass

A base class that can be extended.

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

### defineClass

Define a new class with the properties and methods of one or more other classes.

The new class can be based on a `SuperClass`, which will be inserted into its
prototype chain.

Furthermore, one or more mixins (object that contain properties and/or methods)
may be specified, which will be applied in order. When a method is replaced
with another method, it will be wrapped in a function that makes the previous
method accessible via `this._super`.

`defineClass(SuperClass [, mixins, ...])`

* `SuperClass` - A base class to extend. If `mixins` are to be included
without a `SuperClass`, pass `null` for SuperClass.
* `mixins` - One or more objects that contain properties and methods
to apply to the new class.

### extendClass

Extend a class with the properties and methods of one or more other classes.

When a method is replaced with another method, it will be wrapped in a
function that makes the replaced method accessible via `this._super`.

`extendClass(destination [, source, ...])`

* `destination` - The class to merge into
* `source` - One or more source classes

## License

Copyright 2014-2015 Cerebris Corporation. MIT License (see LICENSE for details).
