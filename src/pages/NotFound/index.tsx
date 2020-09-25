import * as React from 'react';
import { Link } from 'react-router-dom';
import { Col } from 'react-bootstrap';

import { gettext } from '../../utils';

type PublicProps = Record<string, unknown>;

export class NotFoundBase extends React.Component<PublicProps> {
  render() {
    return (
      <Col>
        <h1>{gettext('Ooops, page not found!')}</h1>
        <p>
          <Link to="/">{gettext('Take me home')}</Link>
        </p>
      </Col>
    );
  }
}

export default NotFoundBase;
