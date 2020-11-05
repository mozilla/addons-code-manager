import * as React from 'react';
import { shallow } from 'enzyme';

import { createInternalVersionFile } from '../../reducers/versions';
import {
  fakeVersionFileWithContent,
  fakeVersionFileWithDiff,
} from '../../test-helpers';
import styles from './styles.module.scss';
import { formatFilesize } from '../../utils';
import { makeApiURL } from '../../api';

import FileMetadata from '.';

describe(__filename, () => {
  it('renders metadata for a file with content', () => {
    const file = createInternalVersionFile(fakeVersionFileWithContent);
    const root = shallow(<FileMetadata file={file} />);

    expect(root.find(`.${styles.sha256}`)).toHaveText(file.sha256);

    const downloadLink = root.find(`.${styles.downloadURL}`).find('a');
    expect(downloadLink).toHaveLength(1);
    expect(downloadLink).toHaveText(file.filename);
    expect(downloadLink).toHaveProp(
      'href',
      // `downloadURL` can only be `null` when `file` is a directory.
      makeApiURL({ url: file.downloadURL as string }),
    );
  });

  it('can render for a file with a diff', () => {
    const file = createInternalVersionFile(fakeVersionFileWithDiff);
    const root = shallow(<FileMetadata file={file} />);

    expect(root.find(`.${styles.sha256}`)).toHaveText(file.sha256);
  });

  it('renders a formatted filesize', () => {
    const size = 12345;
    const file = createInternalVersionFile({
      ...fakeVersionFileWithContent,
      size,
    });
    const root = shallow(<FileMetadata file={file} />);

    expect(root.find(`.${styles.size}`)).toHaveText(formatFilesize(size));
  });
});
