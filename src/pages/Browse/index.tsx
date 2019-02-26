import * as React from 'react';
import { RouteComponentProps } from 'react-router-dom';
import { connect } from 'react-redux';
import { Col } from 'react-bootstrap';
import log from 'loglevel';

import { ApplicationState, ConnectedReduxProps } from '../../configureStore';
import { ApiState } from '../../reducers/api';
import FileTree from '../../components/FileTree';
import {
  Version,
  VersionFile,
  fetchVersion,
  fetchVersionFile,
  getVersionFile,
  getVersionInfo,
} from '../../reducers/versions';
import { gettext } from '../../utils';
import Loading from '../../components/Loading';
import CodeView from '../../components/CodeView';

export type PublicProps = {
  _fetchVersion: typeof fetchVersion;
  _fetchVersionFile: typeof fetchVersionFile;
  _log: typeof log;
};

type PropsFromRouter = {
  addonId: string;
  versionId: string;
};

type PropsFromState = {
  apiState: ApiState;
  file: VersionFile | null | void;
  version: Version;
};

export type Props = RouteComponentProps<PropsFromRouter> &
  PropsFromState &
  PublicProps &
  ConnectedReduxProps;

export class BrowseBase extends React.Component<Props> {
  static defaultProps = {
    _fetchVersion: fetchVersion,
    _fetchVersionFile: fetchVersionFile,
    _log: log,
  };

  componentDidMount() {
    const { _fetchVersion, dispatch, match } = this.props;
    const { addonId, versionId } = match.params;

    dispatch(
      _fetchVersion({
        addonId: parseInt(addonId, 10),
        versionId: parseInt(versionId, 10),
      }),
    );
  }

  onSelectFile = (path: string) => {
    const { _fetchVersionFile, dispatch, match } = this.props;
    const { addonId, versionId } = match.params;

    dispatch(
      _fetchVersionFile({
        addonId: parseInt(addonId, 10),
        versionId: parseInt(versionId, 10),
        path,
      }),
    );
  };

  render() {
    const { file, version } = this.props;

    if (!version) {
      return (
        <Col>
          <Loading message={gettext('Loading version...')} />
        </Col>
      );
    }

    return (
      <React.Fragment>
        <Col md="3">
          <FileTree version={version} onSelect={this.onSelectFile} />
        </Col>
        <Col md="9">
          {file ? (
            <CodeView mimeType={'application/json'} file={file} />
          ) : (
            <Loading message={gettext('Loading content...')} />
          )}
        </Col>
      </React.Fragment>
    );
  }
}

const mapStateToProps = (
  state: ApplicationState,
  ownProps: RouteComponentProps<PropsFromRouter>,
): PropsFromState => {
  const { match } = ownProps;
  const versionId = parseInt(match.params.versionId, 10);

  const version = getVersionInfo(state.versions, versionId);
  const file = version
    ? getVersionFile(state.versions, versionId, version.selectedPath)
    : null;

  return {
    apiState: state.api,
    file,
    version,
  };
};

export default connect(mapStateToProps)(BrowseBase);
