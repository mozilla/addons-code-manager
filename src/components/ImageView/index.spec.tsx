import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';

import { createFakeLogger } from '../../test-helpers';
import styles from './styles.module.scss';

import ImageView, { PublicProps } from '.';

describe(__filename, () => {
  const render = ({
    _btoa = btoa,
    _log = createFakeLogger(),
    content = 'some image content',
    mimeType = 'image/png',
    ...props
  }: Partial<PublicProps> = {}) => {
    return shallow(
      <ImageView
        _btoa={_btoa}
        _log={_log}
        mimeType={mimeType}
        content={content}
        {...props}
      />,
    );
  };

  it('renders an img tag', () => {
    const content = 'some content';
    const mimeType = 'image/png';
    const root = render({ content, mimeType });

    expect(root.find('img')).toHaveLength(1);
    expect(root.find('img')).toHaveProp(
      'src',
      `data:${mimeType};base64,${btoa(content)}`,
    );
  });

  it('renders a message if an image has an invalid mimeType', () => {
    const root = render({ mimeType: 'invalid/type' });

    expect(root.find('p')).toHaveText('Unrecognized image format');
  });

  it('calls sanitize on svg files', () => {
    const _sanitize = jest.fn();
    const content = 'some content';
    const mimeType = 'image/svg+xml';
    render({ _sanitize, content, mimeType });

    expect(_sanitize).toHaveBeenCalledWith(content);
  });

  it('recognizes upper cased svg mimeType', () => {
    const _sanitize = jest.fn();
    const content = 'some content';
    const mimeType = 'IMAGE/SVG+XML';
    render({ _sanitize, content, mimeType });

    expect(_sanitize).toHaveBeenCalledWith(content);
  });

  it('does not call sanitize on non-svg files', () => {
    const _sanitize = jest.fn();
    const content = 'some content';
    const mimeType = 'image/png';
    render({ _sanitize, content, mimeType });

    expect(_sanitize).not.toHaveBeenCalled();
  });

  it('sanitizes an svg file', () => {
    const content = `
      <svg version="1.1">
        <circle fill="red" />
        <script>alert('XSS via SVG')</script>
      </svg>
    `;
    const root = render({ content, mimeType: 'image/svg+xml' });

    const img: ShallowWrapper = root.find('img');
    const src: string = img.prop('src');
    const parts = src.split(',');
    const contentPart = parts[parts.length - 1];

    const svg = String(atob(contentPart));
    expect(svg).toContain('<circle');
    expect(svg).not.toContain('<script>');
  });

  it('renders responsive images', () => {
    const root = render();
    expect(root.find('img')).toHaveClassName(styles.responsive);
  });
});
