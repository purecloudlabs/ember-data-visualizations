/* eslint-env node */
module.exports = function (environment) {
    let ENV = {
        modulePrefix: 'dummy',
        environment,
        rootURL: '/',
        locationType: 'auto',
        EmberENV: {
            FEATURES: {

            },
            EXTEND_PROTOTYPES: {
                Date: false
            }
        },

        APP: {

        }
    };

    if (environment === 'test') {
    // Testem prefers this...
        ENV.locationType = 'none';

        // keep test console output quieter
        ENV.APP.LOG_ACTIVE_GENERATION = false;
        ENV.APP.LOG_VIEW_LOOKUPS = false;

        ENV.APP.rootElement = '#ember-testing';
        ENV.APP.autoboot = false;
    }

    return ENV;
};
