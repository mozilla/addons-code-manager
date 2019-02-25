import * as React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

type PublicProps = {
  message: string;
};

const LoadingBase = ({ message }: PublicProps) => {
  return (
    <React.Fragment>
      <FontAwesomeIcon icon="spinner" spin /> {message}
    </React.Fragment>
  );
};

export default LoadingBase;
