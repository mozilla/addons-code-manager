import * as React from 'react';
import { Link } from 'react-router-dom';
import { Col } from 'react-bootstrap';

type PublicProps = {};

export class IndexBase extends React.Component<PublicProps> {
  render() {
    return (
      <Col>
        <p>
          There is nothing you can do here, but try{' '}
          <Link to="/en-US/browse/502955/versions/1541798/">
            browsing this add-on version.
          </Link>
        </p>
      </Col>
    );
  }
}

export default IndexBase;
