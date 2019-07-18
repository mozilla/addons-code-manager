import { shallow } from 'enzyme';
import queryString from 'query-string';
import * as React from 'react';
import { Alert } from 'react-bootstrap';

import { allowSlowPagesParam } from '../../utils';
import { createFakeLocation } from '../../test-helpers';

import SlowPageAlert from '.';

describe(__filename, () => {
  const render = (otherProps = {}) => {
    const props = {
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

    expect(_shouldAllowSlowPages).toHaveBeenCalledWith(location);

    expect(getMessage).toHaveBeenCalledWith(allowSlowPages);
    expect(getLinkText).toHaveBeenCalledWith(allowSlowPages);
  });

  it.each([true, false])(
    'links to the inverse of allowSlowPages=%s',
    (allowSlowPages) => {
      const root = render({
        _shouldAllowSlowPages: jest.fn(() => allowSlowPages),
      });

      expect(root.find(Alert.Link)).toHaveProp(
        'href',
        expect.urlWithTheseParams({
          [allowSlowPagesParam]: String(!allowSlowPages),
        }),
      );
    },
  );

  it('preserves existing query string parameters', () => {
    const location = createFakeLocation({
      search: queryString.stringify({ color: 'red' }),
    });
    const link = render({ location }).find(Alert.Link);

    expect(link).toHaveProp(
      'href',
      expect.urlWithTheseParams({ color: 'red' }),
    );
  });

  it('preserves existing location pathname', () => {
    const pathname = '/some/path/to/page';
    const location = createFakeLocation({ pathname });
    const link = render({ location }).find(Alert.Link);

    expect(link).toHaveProp(
      'href',
      expect.stringMatching(new RegExp(`^${pathname}`)),
    );
  });
});
