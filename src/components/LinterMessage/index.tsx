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

const renderDescription = (description: LinterMessageType['description']) => {
  const urlPattern = /^https?:\/\//;

  return description.reduce((allLines: React.ReactNode[], line, lineIndex) => {
    if (lineIndex > 0) {
      allLines.push(<br key={line} />);
    }

    allLines.push(
      // Intercept and replace URLs with JSX links.
      line
        .trim()
        .split(' ')
        .reduce((allWords: React.ReactNode[], word, wordIndex) => {
          if (wordIndex > 0) {
            // Put back the space.
            allWords.push(' ');
          }

          if (urlPattern.test(word)) {
            allWords.push(<Alert.Link href={word}>{word}</Alert.Link>);
          } else {
            allWords.push(word);
          }

          return allWords;
        }, []),
    );

    return allLines;
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
