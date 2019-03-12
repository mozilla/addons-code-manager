import * as React from 'react';
import he from 'he';
import { Alert } from 'react-bootstrap';

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
      // Intercept and replace URLs with JSX links.
      line.split(/(\s+)/).reduce((allParts: React.ReactNode[], part) => {
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
  message: LinterMessage;
};

const LinterMessageBase = (props: PublicProps) => {
  const { description, message, type } = props.message;
  return (
    <Alert variant={getAlertVariant(type)}>
      <Alert.Heading>{decodeHtmlEntities(message)}</Alert.Heading>
      <p className={styles.description}>{renderDescription(description)}</p>
    </Alert>
  );
};

export default LinterMessageBase;
