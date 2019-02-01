import { configure } from '@storybook/react';
// Automatically import all files ending in *.stories.tsx
const req = require.context('../', true, /.stories.tsx$/);

function loadStories() {
  req.keys().forEach(req);
}

configure(loadStories, module);
