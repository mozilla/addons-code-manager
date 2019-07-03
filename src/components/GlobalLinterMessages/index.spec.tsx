import * as React from 'react';
import { shallow, mount } from 'enzyme';

import LinterMessage from '../LinterMessage';
import {
  fakeExternalLinterMessage,
  createFakeLocation,
  createContextWithFakeRouter,
} from '../../test-helpers';
import { createInternalMessage } from '../../reducers/linter';
import { getCodeLineAnchorID } from '../CodeView/utils';

import GlobalLinterMessages, { PublicProps } from '.';

describe(__filename, () => {
  const render = (props: PublicProps) => {
    return shallow(<GlobalLinterMessages {...props} />);
  };

  const renderWithMount = (props: PublicProps) => {
    const location = createFakeLocation();
    const context = createContextWithFakeRouter({ location });
    return mount(<GlobalLinterMessages {...props} />, context);
  };

  it('renders no linter messages when messages is an empty array', () => {
    const root = render({ messages: [] });

    expect(root.type()).toEqual(null);
  });

  it('renders no linter messages when messages is undefined', () => {
    const root = render({ messages: undefined });

    expect(root.type()).toEqual(null);
  });

  it('renders multiple linter messages', () => {
    const messages = [
      createInternalMessage({
        ...fakeExternalLinterMessage,
        uid: 'first-message',
      }),
      createInternalMessage({
        ...fakeExternalLinterMessage,
        uid: 'second-message',
      }),
    ];
    const root = render({ messages });

    expect(root.find(LinterMessage)).toHaveLength(messages.length);
  });

  it('renders a custom className', () => {
    const messages = [createInternalMessage(fakeExternalLinterMessage)];
    const className = 'custom-classname';
    const props = { messages, className };
    const root = render(props);

    expect(root.find(`.${className}`)).toHaveLength(1);
  });

  it('calls containerRef when rendering', () => {
    const containerRef = jest.fn();
    const messages = [createInternalMessage(fakeExternalLinterMessage)];
    const root = renderWithMount({ containerRef, messages });

    expect(containerRef).toHaveBeenCalledWith(
      root.find(`#${getCodeLineAnchorID(0)}`).getDOMNode(),
    );
  });
});
