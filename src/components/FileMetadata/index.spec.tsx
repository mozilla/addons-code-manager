import * as React from 'react';
import { shallow } from 'enzyme';

import { testVersionFile } from '../../test-helpers';
import styles from './styles.module.scss';

import FileMetadata from '.';

describe(__filename, () => {
  it('renders metadata for a file', () => {
    const file = testVersionFile;

    const root = shallow(<FileMetadata file={file} />);

    expect(root.find(`.${styles.version}`)).toHaveText(file.version);
    expect(root.find(`.${styles.size}`)).toHaveText(file.size.toString());
    expect(root.find(`.${styles.sha256}`)).toHaveText(file.sha256);
    expect(root.find(`.${styles.mimeType}`)).toHaveText(file.mimeType);
  });
});
