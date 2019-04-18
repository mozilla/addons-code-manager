import * as React from 'react';
import { Col } from 'react-bootstrap';

import { gettext } from '../../utils';

type Props = {
  apiHost: string;
  repoUrl: string;
};

export class IndexBase extends React.Component<Props> {
  static defaultProps = {
    apiHost: process.env.REACT_APP_API_HOST,
    repoUrl: 'https://github.com/mozilla/addons-code-manager',
  };

  render() {
    const { apiHost, repoUrl } = this.props;

    return (
      <Col>
        <p>
          {gettext(`🚧 This project is under active development. If you find a
            bug, please`)}{' '}
          <a href={`${repoUrl}/issues/new`}>{gettext('file an issue')}</a>.
        </p>
        <p>{gettext('Other useful links:')}</p>
        <ul>
          <li>
            <a href={apiHost}>{gettext('AMO (frontend)')}</a>
          </li>
          <li>
            <a href={`${apiHost}/reviewers/`}>{gettext('Reviewers Tools')}</a>
          </li>
          <li>
            <a href={`${apiHost}/developers/`}>{gettext('Developer Hub')}</a>
          </li>
          <li>
            <a href={repoUrl}>{gettext('GitHub repository')}</a>
          </li>
        </ul>
      </Col>
    );
  }
}

export default IndexBase;
