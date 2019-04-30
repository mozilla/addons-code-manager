import * as React from 'react';
import { shallow } from 'enzyme';

import { createFakeLogger } from '../../test-helpers';

import ImageView from '.';

describe(__filename, () => {
  const render = ({
    _btoa = btoa,
    _log = createFakeLogger(),
    _sanitize = jest.fn(),
    content = 'some image content',
    mimeType = 'mime/type',
  } = {}) => {
    return shallow(
      <ImageView
        _btoa={_btoa}
        _log={_log}
        _sanitize={_sanitize}
        mimeType={mimeType}
        content={content}
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

  it('does not render an img tag when btoa fails', () => {
    const _btoa = jest.fn().mockImplementation(() => {
      throw new Error();
    });

    const root = render({ _btoa });

    expect(root.find('img')).toHaveLength(0);
  });

  it('logs a debug message when btoa fails', () => {
    const _btoa = jest.fn().mockImplementation(() => {
      throw new Error();
    });
    const _log = createFakeLogger();

    render({ _btoa, _log });

    expect(_btoa).toHaveBeenCalled();
    expect(_log.debug).toHaveBeenCalled();
  });

  it('calls sanitize on svg files', () => {
    const _sanitize = jest.fn();
    const content = 'some content';
    const mimeType = 'image/svg+xml';
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
});
