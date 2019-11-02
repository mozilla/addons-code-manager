import React from 'react';
import { storiesOf } from '@storybook/react';

import ToggleButton from '../src/components/ToggleButton';

const renderToggleButton = (props = {}) => {
  return <ToggleButton onClick={() => {}} {...props} />;
};

storiesOf('ToggleButton', module).addWithChapters('all variants', {
  chapters: [
    {
      sections: [
        {
          title: 'default button',
          sectionFn: () => renderToggleButton(),
        },
        {
          title: 'with a label',
          sectionFn: () => renderToggleButton({ label: 'toggle me' }),
        },
        {
          title: 'toggleLeft = "true"',
          sectionFn: () => renderToggleButton({ toggleLeft: true }),
        },
        {
          title: 'toggleLeft = "true" with a label',
          sectionFn: () =>
            renderToggleButton({ toggleLeft: true, label: 'toggle me' }),
        },
      ],
    },
  ],
});
