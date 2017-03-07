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
    included() {
        this._super.included(...arguments);

        this.import('bower_components/crossfilter/crossfilter.js');
        this.import('bower_components/d3/d3.js');
        this.import('bower_components/d3-tip/index.js');
        this.import('bower_components/dcjs/dc.js');
        this.import('bower_components/lodash/lodash.js');
    }
};
