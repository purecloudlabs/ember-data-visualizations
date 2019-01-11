/* eslint-env node */
'use strict';

const TreeMerger = require('broccoli-merge-trees');
const Funnel = require('broccoli-funnel');
const LessCompiler = require('broccoli-less-single');

module.exports = {
    name: require('./package').name,

    options: {
        autoImport: {
            exclude: ['moment']
        }
    },

    included() {
        this._super.included.apply(this, arguments);
    },

    isDevelopingAddon() {
        return Boolean(process.env.DATA_VIS_DEV_MODE);
    },

    treeForAddon(tree) {
        const defaultTree = this._super.treeForAddon.call(this, tree);

        // Funnel the addon's component styles so they can be imported into addon.less
        const addonLessTree = new Funnel(tree, {
            include: ['components/**/*.less'],
            destDir: 'styles/addon'
        });

        const compiledLessTree = new LessCompiler(new TreeMerger([tree, addonLessTree]), 'styles/addon.less', `${this.name}.css`);

        return new TreeMerger([defaultTree, compiledLessTree]);
    }
};
