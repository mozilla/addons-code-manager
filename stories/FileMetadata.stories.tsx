import React from 'react';
import { storiesOf } from '@storybook/react';

import FileMetadata from '../src/components/FileMetadata';
import { testVersionFile } from '../src/test-helpers';

storiesOf('FileMetadata', module).add('default', () => (
  <FileMetadata file={testVersionFile} />
));
