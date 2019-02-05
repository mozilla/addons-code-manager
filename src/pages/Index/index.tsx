import * as React from 'react';
import { Link } from 'react-router-dom';

type PublicProps = {};

export class IndexBase extends React.Component<PublicProps> {
  render() {
    return (
      <div>
        <p>
          There is nothing you can do here, but try{' '}
          <Link to="/en-US/firefox/files/browse/1541786/">
            browsing this add-on version.
          </Link>
        </p>
      </div>
    );
  }
}

export default IndexBase;
