import { configure } from '@storybook/ember';
import '@storybook/addon-console';

function loadStories() {
  require('../stories/components.js');
}

configure(loadStories, module);