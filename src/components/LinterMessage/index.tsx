import * as React from 'react';
import { Alert } from 'react-bootstrap';

import styles from './styles.module.scss';
import { LinterMessage as LinterMessageType } from '../../linter';

export type PublicProps = {
  description: LinterMessageType['description'];
  message: LinterMessageType['message'];
  type: LinterMessageType['type'];
};

const getAlertVariant = (type: PublicProps['type']) => {
  switch (type) {
    case 'error':
      return 'danger';
    case 'warning':
      return 'warning';
    default:
    case 'notice':
      return 'secondary';
  }
};

const urlPattern = /^https?:\/\//;

const renderDescriptionPart = (part: string) => {
  // Split a description into words to intercept and replace
  // URLs with JSX links.
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

const LinterMessage = ({ description, message, type }: PublicProps) => {
  return (
    <Alert variant={getAlertVariant(type)}>
      <Alert.Heading>{message}</Alert.Heading>
      <p className={styles.description}>
        {description.reduce((lines: React.ReactNode[], desc, index) => {
          if (index > 0) {
            lines.push(<br key={desc} />);
          }
          lines.push(renderDescriptionPart(desc));
          return lines;
        }, [])}
      </p>
    </Alert>
  );
};

export default LinterMessage;
