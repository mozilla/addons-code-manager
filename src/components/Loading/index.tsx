import * as React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

type PublicProps = {
  message: string;
};

function LoadingBase({ message }: PublicProps) {
  return (
    <>
      <FontAwesomeIcon icon="spinner" spin /> {message}
    </>
  );
}

export default LoadingBase;
