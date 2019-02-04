import * as React from 'react';
import { Link } from 'react-router-dom';

type PublicProps = {};

export class NotFoundBase extends React.Component<PublicProps> {
  render() {
    return (
      <div>
        <h1>Ooops, page not found!</h1>
        <p>
          <Link to="/">Take me home</Link>
        </p>
      </div>
    );
  }
}

export default NotFoundBase;
