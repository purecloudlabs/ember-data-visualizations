/* jshint node: true */
'use strict';

var TreeMerger = require('broccoli-merge-trees');
var Funnel = require('broccoli-funnel');
var LessCompiler = require('broccoli-less-single');

module.exports = {
    name: 'ember-data-visualizations',
    isDevelopingAddon() {
        // Check for environment both on this app and parent app
        return (this.app && this.app.env && this.app.env === 'development') || (this.app && this.app.parent && this.app.parent.app && this.app.parent.app.env === 'development');
    },
    treeForAddon(tree) {
        var defaultTree = this._super.treeForAddon.call(this, tree);
        
        // Funnel the addon's component styles so they can be imported into addon.less
        var addonLessTree = new Funnel(tree, {
            include: ['components/**/*.less'],
            destDir: 'styles/addon'
        });

        var compiledLessTree = new LessCompiler(new TreeMerger([tree, addonLessTree]), 'styles/addon.less', this.name + '.css');

        return new TreeMerger([defaultTree, compiledLessTree]);
    },
    included(app) {
        debugger;
        if (typeof app.import !== 'function' && app.app) {
            app = app.app;
        }

        app.options = app.options || {};
        app.import = app.import || function () {};
        this.app = app;

        this._super.included(app);

        app.import('bower_components/crossfilter/crossfilter.js');
        app.import('bower_components/d3/d3.js');
        app.import('bower_components/d3-tip/index.js');
        app.import('bower_components/dcjs/dc.js');
        app.import('bower_components/lodash/lodash.js');
    }
};
