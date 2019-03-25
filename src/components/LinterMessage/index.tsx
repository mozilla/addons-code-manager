import * as React from 'react';
import purify from 'dompurify';
import he from 'he';
import { Alert } from 'react-bootstrap';
import makeClassName from 'classnames';

import styles from './styles.module.scss';
import { LinterMessage } from '../../reducers/linter';

const getAlertVariant = (type: LinterMessage['type']) => {
  switch (type) {
    case 'error':
      return 'danger';
    case 'warning':
      return 'warning';
    default:
      return 'secondary';
  }
};

export const decodeHtmlEntities = (text: string) => {
  // This decodes HTML entities (like &lt;) so that React will
  // encode / escape them again. Without this, React will double encode the
  // HTML entities
  return he.decode(text);
};

const renderDescription = (description: LinterMessage['description']) => {
  const urlPattern = /^https?:\/\//;

  return description.reduce((allLines: React.ReactNode[], line, lineIndex) => {
    if (lineIndex > 0) {
      allLines.push(<br key={line} />);
    }

    allLines.push(
      // Replace anchor tags with just their text, which are the URLs.
      purify
        .sanitize(line, { ALLOWED_TAGS: [] })
        // Intercept and replace URLs with JSX links.
        .split(/(\s+)/)
        .reduce((allParts: React.ReactNode[], part) => {
          if (urlPattern.test(part)) {
            allParts.push(
              <Alert.Link key={`link:${part}`} href={part}>
                {part}
              </Alert.Link>,
            );
          } else {
            allParts.push(decodeHtmlEntities(part));
          }

          return allParts;
        }, []),
    );

    return allLines;
  }, []);
};

type PublicProps = {
  inline?: boolean;
  message: LinterMessage;
};

const LinterMessageBase = ({ message, inline = false }: PublicProps) => {
  const { description, message: linterMessage, type } = message;
  const variant = getAlertVariant(type);

  return (
    <Alert
      className={makeClassName(styles[variant], { [styles.inline]: inline })}
      variant={variant}
    >
      <Alert.Heading>{decodeHtmlEntities(linterMessage)}</Alert.Heading>
      <p className={styles.description}>{renderDescription(description)}</p>
    </Alert>
  );
};

export default LinterMessageBase;
