import * as React from 'react';
import { Link } from 'react-router-dom';

import { gettext } from '../../utils';

type PublicProps = {};

export class NotFoundBase extends React.Component<PublicProps> {
  render() {
    return (
      <div>
        <h1>{gettext('Ooops, page not found!')}</h1>
        <p>
          <Link to="/">{gettext('Take me home')}</Link>
        </p>
      </div>
    );
  }
}

export default NotFoundBase;
