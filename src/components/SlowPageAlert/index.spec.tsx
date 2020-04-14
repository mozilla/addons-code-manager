import { shallow } from 'enzyme';
import queryString from 'query-string';
import * as React from 'react';
import { Alert } from 'react-bootstrap';

import { allowSlowPagesParam } from '../../utils';
import { createFakeHistory, createFakeLocation } from '../../test-helpers';

import SlowPageAlert from '.';

describe(__filename, () => {
  const render = (otherProps = {}) => {
    const props = {
      history: createFakeHistory(),
      location: createFakeLocation(),
      getLinkText: () => 'example link text',
      getMessage: () => 'example message',
      ...otherProps,
    };
    return shallow(<SlowPageAlert {...props} />);
  };

  it('renders an alert with text callbacks', () => {
    const text = 'This page is slow';
    const linkText = 'Click here to speed it up';
    const root = render({
      getMessage: () => text,
      getLinkText: () => linkText,
    });

    expect(root.find(Alert).text()).toMatch(text);
    expect(root.find(Alert.Link).text()).toMatch(linkText);
  });

  it('calls shouldAllowSlowPages without a allowByDefault param', () => {
    const _shouldAllowSlowPages = jest.fn();

    render({ _shouldAllowSlowPages });

    expect(_shouldAllowSlowPages).toHaveBeenCalledWith(
      expect.objectContaining({
        allowByDefault: undefined,
      }),
    );
  });

  it('can override allowByDefault in call to shouldAllowSlowPages', () => {
    const _shouldAllowSlowPages = jest.fn();
    const allowByDefault = true;

    render({
      _shouldAllowSlowPages,
      allowSlowPagesByDefault: allowByDefault,
    });

    expect(_shouldAllowSlowPages).toHaveBeenCalledWith(
      expect.objectContaining({ allowByDefault }),
    );
  });

  it('calls text getters with slowness state', () => {
    const location = createFakeLocation();
    const getMessage = jest.fn(() => 'example message');
    const getLinkText = jest.fn(() => 'example link text');

    const allowSlowPages = false;
    const _shouldAllowSlowPages = jest.fn(() => allowSlowPages);

    render({
      _shouldAllowSlowPages,
      getMessage,
      getLinkText,
      location,
    });

    expect(_shouldAllowSlowPages).toHaveBeenCalledWith(
      expect.objectContaining({ location }),
    );

    expect(getMessage).toHaveBeenCalledWith(allowSlowPages);
    expect(getLinkText).toHaveBeenCalledWith(allowSlowPages);
  });

  it.each([true, false])(
    'links to the inverse of allowSlowPages=%s',
    (allowSlowPages) => {
      const history = createFakeHistory();
      const location = createFakeLocation({ search: '' });
      const root = render({
        _shouldAllowSlowPages: jest.fn(() => allowSlowPages),
        history,
        location,
      });

      root.find(Alert.Link).simulate('click');
      expect(history.push).toHaveBeenCalledWith(
        expect.objectContaining({
          search: `${allowSlowPagesParam}=${String(!allowSlowPages)}`,
        }),
      );
    },
  );

  it('preserves existing query string parameters', () => {
    const color = 'red';
    const location = createFakeLocation({
      search: queryString.stringify({ color }),
    });
    const history = createFakeHistory();
    const root = render({ history, location });

    root.find(Alert.Link).simulate('click');
    expect(history.push).toHaveBeenCalledWith(
      expect.objectContaining({
        search: expect.stringContaining(`color=${color}`),
      }),
    );
  });

  it('preserves existing location pathname', () => {
    const pathname = '/some/path/to/page';
    const location = createFakeLocation({ pathname });
    const history = createFakeHistory();
    const root = render({ history, location });

    root.find(Alert.Link).simulate('click');
    expect(history.push).toHaveBeenCalledWith(
      expect.objectContaining({ pathname }),
    );
  });
});
