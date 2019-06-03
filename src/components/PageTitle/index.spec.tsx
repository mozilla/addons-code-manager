import * as React from 'react';
import { shallow } from 'enzyme';

import PageTitle, { DefaultProps, PublicProps } from '.';

describe(__filename, () => {
  const render = (moreProps = {}) => {
    const props: PublicProps & Partial<DefaultProps> = {
      children: <div />,
      title: 'Some Prefix',
      ...moreProps,
    };
    return shallow(<PageTitle {...props} />);
  };

  const renderAndSetTitle = (...params: Parameters<typeof render>) => {
    const root = render(...params);
    (root.instance() as PageTitle)._setTitle();
  };

  const createFakeDocument = (params = {}) => {
    return { title: 'title not set', ...params };
  };

  it('renders children', () => {
    const className = 'ChildExample';
    const children = <span className={className} />;
    const root = render({ children });

    expect(root).toHaveClassName(className);
  });

  it('sets a title on mount', () => {
    const _setTitle = jest.fn();
    render({ _setTitle });

    expect(_setTitle).toHaveBeenCalled();
  });

  it('sets a title on update', () => {
    const _setTitle = jest.fn();
    const root = render({ _setTitle });
    _setTitle.mockClear();
    root.setProps({});

    expect(_setTitle).toHaveBeenCalled();
  });

  it('does not set a title with a null value', () => {
    const originalTitle = 'original document title';
    const _document = createFakeDocument({ title: originalTitle });

    renderAndSetTitle({ _document, title: null });

    expect(_document.title).toEqual(originalTitle);
  });

  it('sets a title', () => {
    const _document = createFakeDocument();
    const title = 'Example Title';
    renderAndSetTitle({
      _document,
      title,
    });

    expect(_document.title).toEqual(title);
  });
});
