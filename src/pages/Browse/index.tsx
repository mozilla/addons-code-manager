import * as React from 'react';
import { RouteComponentProps } from 'react-router-dom';
import { connect } from 'react-redux';
import { Col, Row } from 'react-bootstrap';
import log from 'loglevel';

import { ApplicationState } from '../../reducers';
import { ConnectedReduxProps } from '../../configureStore';
import { ApiState } from '../../reducers/api';
import FileTree from '../../components/FileTree';
import {
  Version,
  VersionFile,
  fetchVersion,
  fetchVersionFile,
  getVersionFile,
  getVersionInfo,
  isFileLoading,
  viewVersionFile,
} from '../../reducers/versions';
import { gettext, getPathFromQueryString } from '../../utils';
import Loading from '../../components/Loading';
import CodeView from '../../components/CodeView';
import FileMetadata from '../../components/FileMetadata';
import styles from './styles.module.scss';

export type PublicProps = {};

export type DefaultProps = {
  _fetchVersion: typeof fetchVersion;
  _fetchVersionFile: typeof fetchVersionFile;
  _log: typeof log;
  _viewVersionFile: typeof viewVersionFile;
};

type PropsFromRouter = {
  addonId: string;
  versionId: string;
};

type PropsFromState = {
  apiState: ApiState;
  file: VersionFile | null | void;
  fileIsLoading: boolean;
  version: Version | void | null;
};

export type Props = RouteComponentProps<PropsFromRouter> &
  PropsFromState &
  PublicProps &
  DefaultProps &
  ConnectedReduxProps;

export class BrowseBase extends React.Component<Props> {
  static defaultProps = {
    _fetchVersion: fetchVersion,
    _fetchVersionFile: fetchVersionFile,
    _log: log,
    _viewVersionFile: viewVersionFile,
  };

  componentDidMount() {
    this.loadData();
  }

  componentDidUpdate(prevProps: Props) {
    this.loadData(prevProps);
  }

  loadData(prevProps?: Props) {
    const {
      _fetchVersion,
      _fetchVersionFile,
      dispatch,
      file,
      fileIsLoading,
      history,
      match,
      version,
    } = this.props;

    if (version === null) {
      // An error has occured when fetching the version.
      return;
    }

    if (version === undefined) {
      const { addonId, versionId } = match.params;

      dispatch(
        _fetchVersion({
          addonId: parseInt(addonId, 10),
          versionId: parseInt(versionId, 10),
        }),
      );
      return;
    }

    const path = getPathFromQueryString(history);

    // We do not want to update the selected path again (e.g., when a keyboard
    // navigation updates the selected path), so we apply this logic to the
    // first render (mount) only.
    if (!prevProps && path && path !== version.selectedPath) {
      // We preserve the hash in the URL (if any) when we load the file from an
      // URL that has likely been shared.
      this.viewVersionFile(path, { preserveHash: true });
      return;
    }

    if (version.selectedPath && !fileIsLoading && file === undefined) {
      dispatch(
        _fetchVersionFile({
          addonId: parseInt(match.params.addonId, 10),
          versionId: version.id,
          path: version.selectedPath,
        }),
      );
    }
  }

  // When selecting a new file to view, we do not want to preserve the hash in
  // the URL (this hash highlights a specific line of code).
  viewVersionFile = (path: string, { preserveHash = false } = {}) => {
    const { _viewVersionFile, dispatch, match } = this.props;
    const { versionId } = match.params;

    dispatch(
      _viewVersionFile({
        versionId: parseInt(versionId, 10),
        selectedPath: path,
        preserveHash,
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
          <Row>
            <Col>
              <FileTree
                onSelect={this.viewVersionFile}
                versionId={version.id}
              />
            </Col>
          </Row>
          {file && (
            <Row>
              <Col className={styles.metadata}>
                <FileMetadata file={file} />
              </Col>
            </Row>
          )}
        </Col>
        <Col md="9">
          {file ? (
            <CodeView
              mimeType={file.mimeType}
              content={file.content}
              version={version}
            />
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

  return {
    apiState: state.api,
    file: version
      ? getVersionFile(state.versions, versionId, version.selectedPath)
      : null,
    fileIsLoading: version
      ? isFileLoading(state.versions, versionId, version.selectedPath)
      : false,
    version,
  };
};

export default connect(mapStateToProps)(BrowseBase);
