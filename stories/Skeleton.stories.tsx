import React from 'react';
import { storiesOf } from '@storybook/react';

import Skeleton from '../src/components/Skeleton';

storiesOf('Skeleton', module).addWithChapters('all variants', {
  chapters: [
    {
      sections: [
        {
          title: 'in a 100 x 50px div',
          sectionFn: () => (
            <div style={{ width: '100px', height: '50px' }}>
              <Skeleton />
            </div>
          ),
        },
        {
          title: 'in a paragraph',
          sectionFn: () => (
            <p>
              <Skeleton />
            </p>
          ),
        },
      ],
    },
  ],
});
