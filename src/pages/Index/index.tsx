import * as React from 'react';
import { Col } from 'react-bootstrap';

import { gettext } from '../../utils';

type Props = {};

export class IndexBase extends React.Component<Props> {
  render() {
    const apiHost = process.env.REACT_APP_API_HOST;
    const repoUrl = 'https://github.com/mozilla/addons-code-manager';

    return (
      <Col>
        <p>
          {gettext(
            'This is a tool for managing add-on source code that is used with the',
          )}{' '}
          <a href={`${apiHost}/reviewers/`}>{gettext('Reviewers Tools')}</a>.
        </p>
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
