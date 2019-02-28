import * as React from 'react';
import { storiesOf } from '@storybook/react';

import VersionChooser from '../src/components/VersionChooser';
import { fakeVersions } from '../src/test-helpers';

storiesOf('VersionChooser', module).addWithChapters('all variants', {
  chapters: [
    {
      sections: [
        {
          title: 'default state',
          sectionFn: () => <VersionChooser versions={fakeVersions} />,
        },
      ],
    },
  ],
});
