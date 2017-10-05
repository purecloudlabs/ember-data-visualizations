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
                    'ember-source': '^2.15.0'
                }
            }
        },
        {
            name: 'ember-beta',
            allowedToFail: true,
            npm: {
                devDependencies: {
                    'ember-source': '2.16.0-beta.1'
                }
            }
        }
  ]
};
