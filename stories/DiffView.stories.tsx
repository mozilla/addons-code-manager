import React from 'react';
import { storiesOf } from '@storybook/react';
import { parseDiff } from 'react-diff-view';

import DiffView from '../src/components/DiffView';
import diffWithDeletions from '../src/components/DiffView/fixtures/diffWithDeletions';
import { renderWithStoreAndRouter } from './utils';

storiesOf('DiffView', module).addWithChapters('all variants', {
  chapters: [
    {
      sections: [
        {
          title: 'diff with additions and deletions',
          sectionFn: () => {
            return renderWithStoreAndRouter(
              <DiffView
                diffs={parseDiff(diffWithDeletions)}
                mimeType="application/javascript"
              />,
            );
          },
        },
        {
          title: 'no differences',
          sectionFn: () => {
            return renderWithStoreAndRouter(
              <DiffView diffs={[]} mimeType="application/javascript" />,
            );
          },
        },
      ],
    },
  ],
});
