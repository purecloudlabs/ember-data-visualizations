# ember-disable-prototype-extensions

Including this addon will disable Ember's prototype extensions.

This is a great idea for addon authors to ensure that their addon does not accidentally depend upon prototype extensions (which may be disabled in a consuming application).

For instructions on disabling prototype extensions see the Ember guide:

http://guides.emberjs.com/v1.11.0/configuring-ember/disabling-prototype-extensions/

## Collaboration

### Setup

* `git clone` this repository
* `npm install`
* `bower install`

### Running Tests

* `npm test` (Runs `ember try:testall` to test your addon against multiple Ember versions)
* `ember test`
* `ember test --server`
