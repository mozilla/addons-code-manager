import React from 'react';
import { storiesOf } from '@storybook/react';

import Skeleton from '../../src/components/Skeleton';

storiesOf('Skeleton', module).addWithChapters('all variants', {
  chapters: [
    {
      sections: [
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
