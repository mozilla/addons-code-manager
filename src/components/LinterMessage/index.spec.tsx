import * as React from 'react';
import { shallow } from 'enzyme';
import { Alert } from 'react-bootstrap';

import styles from './styles.module.scss';

import LinterMessage, { PublicProps } from '.';

describe(__filename, () => {
  const render = (moreProps = {}) => {
    const props: PublicProps = {
      description: 'Your add-on uses a JavaScript library we consider unsafe.',
      message: 'Banned 3rd-party JS library',
      type: 'error',
      ...moreProps,
    };
    return shallow(<LinterMessage {...props} />);
  };

  it.each([
    ['danger', 'error'],
    ['warning', 'warning'],
    ['secondary', 'notice'],
  ])('renders the Alert variant "%s" for "%s"', (alertVariant, messageType) => {
    expect(render({ type: messageType }).find(Alert)).toHaveProp(
      'variant',
      alertVariant,
    );
  });

  it('renders a message and description', () => {
    const message = 'Markup parsing error';
    const description = 'There was an error parsing...';
    const root = render({ message, description });

    expect(root.find(Alert.Heading)).toHaveText(message);
    expect(root.find(`.${styles.description}`)).toHaveText(description);
  });

  it('renders a line break for multi-line messages', () => {
    const description = [
      'There was an error parsing the markup document.',
      'malformed start tag, at line 1, column 26',
    ];
    const root = render({ description });

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
    const root = render({ description });

    expect(root.find(`.${styles.description}`).find('br')).toHaveLength(
      description.length - 1,
    );
  });

  it('renders a link for URLs', () => {
    const url = 'https://bit.ly/1TRIyZY';
    const description = `Your add-on uses a JavaScript library we
      consider unsafe. Read more: ${url}`;
    const root = render({ description });

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
    const root = render({ description: urls.join(' ') });

    const link = root.find(Alert.Link);
    expect(link).toHaveLength(urls.length);

    expect(link.at(0)).toHaveProp('href', urls[0]);
    expect(link.at(1)).toHaveProp('href', urls[1]);
    expect(link.at(2)).toHaveProp('href', urls[2]);
  });
});
