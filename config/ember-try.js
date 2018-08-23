/* eslint-env node */
module.exports = {
    scenarios: [
        {
            name: 'ember-default',
            npm: {
                devDependencies: {}
            }
        },
        {
            name: 'ember-release',
            npm: {
                devDependencies: {
                    'ember-source': '2.18.2'
                }
            }
        },
        {
            name: 'ember-beta',
            allowedToFail: true,
            npm: {
                devDependencies: {
                    'ember-source': '3.3.0'
                }
            }
        }
    ]
};
