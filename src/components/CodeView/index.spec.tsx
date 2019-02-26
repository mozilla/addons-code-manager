import * as React from 'react';
import { shallow } from 'enzyme';
import Refractor from 'react-refractor/all';

import styles from './styles.module.scss';

import CodeView, { getLanguage, getLines } from '.';

describe(__filename, () => {
  const render = ({
    content = 'some content',
    mimeType = 'mime/type',
  } = {}) => {
    return shallow(<CodeView mimeType={mimeType} content={content} />);
  };

  it('renders a CodeView component', () => {
    const root = render();

    expect(root.find(`.${styles.CodeView}`)).toHaveLength(1);
    expect(root.find(`.${styles.lineNumbers}`)).toHaveLength(1);
    expect(root.find(`.${styles.content}`)).toHaveLength(1);
  });

  it('renders a Refractor component when language is supported', () => {
    const content = '{ "foo": "bar" }';
    const mimeType = 'application/json';
    const root = render({ mimeType, content });

    expect(root.find(Refractor)).toHaveLength(1);
    expect(root.find(Refractor)).toHaveProp('language', getLanguage(mimeType));
    expect(root.find(Refractor)).toHaveProp('value', content);
  });

  describe('getLanguage', () => {
    it('returns null when mime type is unsupported', () => {
      expect(getLanguage('unknown/mimetype')).toEqual(null);
    });

    it.each([
      ['application/javascript', 'js'],
      ['text/javascript', 'js'],
      ['application/json', 'json'],
      ['application/xml', 'xml'],
      ['text/css', 'css'],
      ['text/html', 'html'],
    ])('supports %s', (mimeType, language) => {
      expect(getLanguage(mimeType)).toEqual(language);
    });
  });

  describe('getLines', () => {
    it('splits a content into lines', () => {
      const lines = ['foo', 'bar'];
      const content = lines.join('\n');

      expect(getLines(content)).toEqual(lines);
    });

    it('ignores a trailing newline', () => {
      const lines = ['foo', 'bar'];
      const content = `${lines.join('\n')}\n`;

      expect(getLines(content)).toEqual(lines);
    });
  });
});
