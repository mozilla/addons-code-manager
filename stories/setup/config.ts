import { configure } from '@storybook/react';

// Include application styles.
import '../../src/styles.scss';
// Apply some custom styles to storybook.
import './styles.scss';

// Automatically import all files ending in *.stories.tsx
const req = require.context('../', true, /.stories.tsx$/);

const loadStories = () => req.keys().forEach(req);
configure(loadStories, module);
