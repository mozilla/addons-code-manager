import * as React from 'react';
import { shallow } from 'enzyme';
import { Alert } from 'react-bootstrap';

import { createInternalMessage } from '../../reducers/linter';
import { fakeExternalLinterMessage } from '../../test-helpers';
import styles from './styles.module.scss';

import LinterMessage, { decodeHtmlEntities } from '.';

describe(__filename, () => {
  const render = ({
    message = createInternalMessage(fakeExternalLinterMessage),
    inline = false,
  } = {}) => {
    return shallow(<LinterMessage message={message} inline={inline} />);
  };

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

    return render({ message });
  };

  it.each([
    ['danger', 'error'],
    ['warning', 'warning'],
    ['secondary', 'notice'],
  ])('renders the Alert variant "%s" for "%s"', (alertVariant, messageType) => {
    const root = renderMessage({ type: messageType });

    expect(root.find(Alert)).toHaveProp('variant', alertVariant);
    expect(root).toHaveClassName(`.${styles[alertVariant]}`);
  });

  it('renders a message and description', () => {
    const message = 'Markup parsing error';
    const description = ['There was an error parsing...'];
    const root = renderMessage({ message, description });

    expect(root.find(Alert.Heading)).toHaveText(message);
    expect(root.find(`.${styles.description}`)).toIncludeText(description[0]);
  });

  it('handles descriptions with extra whitespace', () => {
    const description = ['  lots    of    space     between'];
    const root = renderMessage({ description });

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
    const url = 'https://mzl.la/25zqk4O';
    const description = [
      `Your add-on uses a JavaScript library we
      consider unsafe. Read more: <a href="${url}">${url}</a>`,
    ];
    const root = renderMessage({ description });

    const link = root.find(Alert.Link);
    expect(link).toHaveText(url);
    expect(link).toHaveProp('href', url);

    expect(root.find(`.${styles.description}`)).toHaveText(
      `Your add-on uses a JavaScript library we
      consider unsafe. Read more: ${url}`,
    );
  });

  it('renders lots of links', () => {
    const urls = [
      'https://bit.ly/first-link',
      'https://bit.ly/second-link',
      'https://bit.ly/third-link',
    ];
    const root = renderMessage({
      description: [urls.map((u) => `<a href="${u}">${u}</a>`).join(' ')],
    });

    const link = root.find(Alert.Link);
    expect(link).toHaveLength(urls.length);

    expect(link.at(0)).toHaveProp('href', urls[0]);
    expect(link.at(1)).toHaveProp('href', urls[1]);
    expect(link.at(2)).toHaveProp('href', urls[2]);
  });

  it('renders HTML entities in messages', () => {
    const message = 'The value of &lt;em:id&gt; is invalid';
    const root = renderMessage({ message });

    expect(root.find(Alert.Heading).html()).toContain(message);
  });

  it('renders HTML entities in descriptions', () => {
    const description = [
      'The values supplied for &lt;em:id&gt; in the install.rdf file is not a valid UUID string.',
    ];
    const root = renderMessage({ description });

    expect(root.find(`.${styles.description}`).html()).toContain(
      description[0],
    );
  });

  it('can be marked as an inline message', () => {
    const root = render({ inline: true });

    expect(root).toHaveClassName(`.${styles.inline}`);
  });

  describe('decodeHtmlEntities', () => {
    it('handles decimal HTML entities', () => {
      // &#34; is the decimal encoding of a quotation mark.
      expect(
        decodeHtmlEntities(
          'The &#34;update_url&#34; is not used by Firefox...',
        ),
      ).toContain('The "update_url"');
    });
  });
});
