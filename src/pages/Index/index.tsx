import * as React from 'react';
import { Link } from 'react-router-dom';

import { ContentShell } from '../../components/FullscreenGrid';
import { gettext } from '../../utils';

type Props = {
  showLocalDevLinks: boolean;
};

export class IndexBase extends React.Component<Props> {
  static defaultProps = {
    showLocalDevLinks: process.env.REACT_APP_IS_LOCAL_DEV === 'true',
  };

  render() {
    const { showLocalDevLinks } = this.props;

    const apiHost = process.env.REACT_APP_API_HOST;
    const repoUrl = 'https://github.com/mozilla/addons-code-manager';

    return (
      <ContentShell>
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
        {showLocalDevLinks && (
          <React.Fragment>
            <hr />
            <p>{gettext('Dev links (only shown in local dev):')}</p>
            <ul>
              <li>
                <Link to="/en-US/browse/494431/versions/1532144/">
                  a browse page
                </Link>
              </li>
              <li>
                <Link to="/en-US/compare/502955/versions/1541794...1541798/">
                  a compare page
                </Link>
              </li>
              <li>
                <Link to="/en-US/browse/502955/versions/1000000/">
                  a browse page that will generate an error
                </Link>
              </li>
            </ul>
          </React.Fragment>
        )}
      </ContentShell>
    );
  }
}

export default IndexBase;
