import { configure, setAddon } from '@storybook/react';
import chaptersAddon from 'react-storybook-addon-chapters';

import configureApplication from '../../src/configureApplication';

// Include application styles.
import '../../src/styles.scss';
// Apply some custom styles to storybook.
import './styles.scss';

configureApplication();

// Automatically import all files ending in *.stories.tsx
const req = require.context('../', true, /.stories.tsx$/);

setAddon(chaptersAddon);

const loadStories = () => req.keys().forEach(req);
configure(loadStories, module);
