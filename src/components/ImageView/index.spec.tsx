import * as React from 'react';
import { shallow } from 'enzyme';

import { getFakeLogger } from '../../test-helpers';

import ImageView from '.';

describe(__filename, () => {
  const render = ({
    _btoa = btoa,
    _log = getFakeLogger(),
    content = 'some image content',
    mimeType = 'mime/type',
  } = {}) => {
    return shallow(
      <ImageView
        _btoa={_btoa}
        _log={_log}
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

  it('calls btoa to convert image data', () => {
    const _btoa = jest.fn();

    render({ _btoa });

    expect(_btoa).toHaveBeenCalled();
  });

  it('logs a warning when btoa fails', () => {
    const _btoa = jest.fn().mockImplementation(() => {
      throw new Error();
    });
    const _log = getFakeLogger();

    render({ _btoa, _log });

    expect(_btoa).toHaveBeenCalled();
    expect(_log.debug).toHaveBeenCalled();
  });
});
