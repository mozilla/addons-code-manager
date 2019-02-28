import * as React from 'react';
import { shallow } from 'enzyme';

import refractor from '../../refractor';
import { mapWithDepth } from './utils';
import { getLanguageFromMimeType } from '../../utils';
import styles from './styles.module.scss';

import CodeView from '.';

describe(__filename, () => {
  const render = ({
    content = 'some content',
    mimeType = 'mime/type',
  } = {}) => {
    return shallow(<CodeView mimeType={mimeType} content={content} />);
  };

  it('renders plain text code when mime type is not supported', () => {
    const mimeType = 'mime/type';
    const root = render({ mimeType });

    expect(root.find(`.${styles.CodeView}`)).toHaveLength(1);
    expect(root.find(`.${styles.lineNumber}`)).toHaveLength(1);
    expect(root.find(`.${styles.code}`)).toHaveLength(1);
    expect(root.find(`.${styles.highlightedCode}`)).toHaveLength(1);
    expect(root.find('.language-text')).toHaveLength(1);
  });

  it('renders highlighted code when language is supported', () => {
    const content = '{ "foo": "bar" }';
    const mimeType = 'application/json';
    const root = render({ mimeType, content });

    expect(root.find(`.${styles.lineNumber}`)).toHaveLength(1);
    expect(root.find(`.${styles.code}`)).toHaveLength(1);
    expect(root.find(`.${styles.highlightedCode}`)).toHaveLength(1);

    expect(root.find('.language-json')).toHaveLength(1);
    expect(root.find('.language-json')).toHaveProp(
      'children',
      refractor
        .highlight(content, getLanguageFromMimeType(mimeType))
        .map(mapWithDepth(0)),
    );
  });

  it('handles empty content', () => {
    const content = '';
    const mimeType = 'text/css';
    const root = render({ mimeType, content });

    expect(root.find('.language-css')).toHaveProp('children', content);
  });

  it('renders multiple lines of code', () => {
    const contentLines = ['{', '"foo":"bar"', '"some": "other-value"', '}'];
    const content = contentLines.join('\n');

    const mimeType = 'application/json';
    const root = render({ mimeType, content });

    expect(root.find(`.${styles.lineNumber}`)).toHaveLength(
      contentLines.length,
    );
    expect(root.find(`.${styles.code}`)).toHaveLength(contentLines.length);
  });
});
