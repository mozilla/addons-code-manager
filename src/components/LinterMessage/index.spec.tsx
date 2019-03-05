import * as React from 'react';
import { shallow } from 'enzyme';
import { Alert } from 'react-bootstrap';

import { createInternalMessage } from '../../linter';
import { fakeExternalLinterMessage } from '../../test-helpers';
import styles from './styles.module.scss';

import LinterMessage from '.';

describe(__filename, () => {
  const renderMessage = (attributes = {}) => {
    const message = createInternalMessage({
      ...fakeExternalLinterMessage,
      description: [
        'Your add-on uses a JavaScript library we consider unsafe.',
      ],
      message: 'Banned 3rd-party JS library',
      type: 'error',
      ...attributes,
    });
    return shallow(<LinterMessage message={message} />);
  };

  it.each([
    ['danger', 'error'],
    ['warning', 'warning'],
    ['secondary', 'notice'],
  ])('renders the Alert variant "%s" for "%s"', (alertVariant, messageType) => {
    expect(renderMessage({ type: messageType }).find(Alert)).toHaveProp(
      'variant',
      alertVariant,
    );
  });

  it('renders a message and description', () => {
    const message = 'Markup parsing error';
    const description = ['There was an error parsing...'];
    const root = renderMessage({ message, description });

    expect(root.find(Alert.Heading)).toHaveText(message);
    expect(root.find(`.${styles.description}`)).toIncludeText(description[0]);
  });

  it('renders a line break for multi-line messages', () => {
    const description = [
      'There was an error parsing the markup document.',
      'malformed start tag, at line 1, column 26',
    ];
    const root = renderMessage({ description });

    const descNode = root.find(`.${styles.description}`);
    expect(descNode).toIncludeText(description[0]);
    expect(descNode).toIncludeText(description[1]);
    expect(descNode.find('br')).toHaveLength(1);
  });

  it('renders enough line breaks for all message lines', () => {
    const description = [
      'first line',
      'second line',
      'third line',
      'so many lines',
    ];
    const root = renderMessage({ description });

    expect(root.find(`.${styles.description}`).find('br')).toHaveLength(
      description.length - 1,
    );
  });

  it('renders a link for URLs', () => {
    const url = 'https://bit.ly/1TRIyZY';
    const description = [
      `Your add-on uses a JavaScript library we
      consider unsafe. Read more: ${url}`,
    ];
    const root = renderMessage({ description });

    const link = root.find(Alert.Link);
    expect(link).toHaveText(url);
    expect(link).toHaveProp('href', url);

    expect(root.find(`.${styles.description}`)).toIncludeText(
      'Your add-on uses a JavaScript library',
    );
  });

  it('renders lots of links', () => {
    const urls = [
      'https://bit.ly/first-link',
      'https://bit.ly/second-link',
      'https://bit.ly/third-link',
    ];
    const root = renderMessage({ description: [urls.join(' ')] });

    const link = root.find(Alert.Link);
    expect(link).toHaveLength(urls.length);

    expect(link.at(0)).toHaveProp('href', urls[0]);
    expect(link.at(1)).toHaveProp('href', urls[1]);
    expect(link.at(2)).toHaveProp('href', urls[2]);
  });
});
