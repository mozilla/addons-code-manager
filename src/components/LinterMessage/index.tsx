import * as React from 'react';
import { Alert } from 'react-bootstrap';

import styles from './styles.module.scss';

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

const renderDescription = (description: string) => {
  return description
    .trim()
    .split(' ')
    .reduce((all: React.ReactNode[], desc, index) => {
      if (index > 0) {
        // Put back the space.
        all.push(' ');
      }

      if (urlPattern.test(desc)) {
        all.push(<Alert.Link href={desc}>{desc}</Alert.Link>);
      } else {
        all.push(desc);
      }

      return all;
    }, []);
};

export type PublicProps = {
  // TODO: Reference Message types once https://github.com/mozilla/addons-code-manager/issues/294 lands
  description: string | string[];
  message: string;
  type: 'notice' | 'error' | 'warning';
};

const LinterMessage = ({ description, message, type }: PublicProps) => {
  const descriptionLines = Array.isArray(description)
    ? description
    : [description];

  return (
    <Alert variant={getAlertVariant(type)}>
      <Alert.Heading>{message}</Alert.Heading>
      <p className={styles.description}>
        {descriptionLines.reduce((lines: React.ReactNode[], desc, index) => {
          if (index > 0) {
            lines.push(<br key={desc} />);
          }
          lines.push(renderDescription(desc));
          return lines;
        }, [])}
      </p>
    </Alert>
  );
};

export default LinterMessage;
