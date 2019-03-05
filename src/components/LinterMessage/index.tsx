import * as React from 'react';
import { Alert } from 'react-bootstrap';

import styles from './styles.module.scss';
import { LinterMessage as LinterMessageType } from '../../linter';

type PublicProps = {
  message: LinterMessageType;
};

const getAlertVariant = (type: LinterMessageType['type']) => {
  switch (type) {
    case 'error':
      return 'danger';
    case 'warning':
      return 'warning';
    default:
      return 'secondary';
  }
};

const renderDescriptionPart = (part: string) => {
  // Split a description into words to intercept and replace
  // URLs with JSX links.
  const urlPattern = /^https?:\/\//;
  return part
    .trim()
    .split(' ')
    .reduce((all: React.ReactNode[], word, index) => {
      if (index > 0) {
        // Put back the space.
        all.push(' ');
      }

      if (urlPattern.test(word)) {
        all.push(<Alert.Link href={word}>{word}</Alert.Link>);
      } else {
        all.push(word);
      }

      return all;
    }, []);
};

const renderDescription = (description: LinterMessageType['description']) => {
  return description.reduce((lines: React.ReactNode[], text, index) => {
    if (index > 0) {
      lines.push(<br key={text} />);
    }
    lines.push(renderDescriptionPart(text));
    return lines;
  }, []);
};

const LinterMessage = (props: PublicProps) => {
  const { description, message, type } = props.message;
  return (
    <Alert variant={getAlertVariant(type)}>
      <Alert.Heading>{message}</Alert.Heading>
      <p className={styles.description}>{renderDescription(description)}</p>
    </Alert>
  );
};

export default LinterMessage;
