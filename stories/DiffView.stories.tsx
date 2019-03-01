import React from 'react';
import { storiesOf } from '@storybook/react';

import DiffView from '../src/components/DiffView';
import diffWithDeletions from '../src/components/DiffView/fixtures/diffWithDeletions';

storiesOf('DiffView', module).add('default', () => (
  <DiffView diff={diffWithDeletions} />
));
