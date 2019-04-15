import * as React from 'react';
import { Col, Row } from 'react-bootstrap';
import { RouteComponentProps } from 'react-router-dom';
import { connect } from 'react-redux';

import { ApplicationState } from '../../reducers';
import { ConnectedReduxProps } from '../../configureStore';
import FileTree from '../../components/FileTree';
import DiffView from '../../components/DiffView';
import Loading from '../../components/Loading';
import VersionChooser from '../../components/VersionChooser';
import {
  CompareInfo,
  Version,
  fetchDiff,
  getVersionInfo,
  viewVersionFile,
} from '../../reducers/versions';
import { gettext, getPathFromQueryString } from '../../utils';
import styles from './styles.module.scss';

export type PublicProps = {
  _fetchDiff: typeof fetchDiff;
  _viewVersionFile: typeof viewVersionFile;
};

type PropsFromRouter = {
  addonId: string;
  baseVersionId: string;
  headVersionId: string;
  lang: string;
};

type PropsFromState = {
  addonId: number;
  compareInfo: CompareInfo | null | void;
  isLoading: boolean;
  version: Version | void;
};

type Props = RouteComponentProps<PropsFromRouter> &
  PropsFromState &
  PublicProps &
  ConnectedReduxProps;

export class CompareBase extends React.Component<Props> {
  static defaultProps = {
    _fetchDiff: fetchDiff,
    _viewVersionFile: viewVersionFile,
  };

  componentDidMount() {
    this.loadData();
  }

  componentDidUpdate(prevProps: Props) {
    this.loadData(prevProps);
  }

  loadData(prevProps?: Props) {
    const { _fetchDiff, dispatch, history, match, version } = this.props;
    const { addonId, baseVersionId, headVersionId, lang } = match.params;

    const oldVersionId = parseInt(baseVersionId, 10);
    const newVersionId = parseInt(headVersionId, 10);

    // We ensure the new version ID is newer than the old version ID when
    // loading the page.
    if (oldVersionId > newVersionId) {
      history.push(
        `/${lang}/compare/${addonId}/versions/${headVersionId}...${baseVersionId}/`,
      );
      return;
    }

    const path = getPathFromQueryString(history);

    if (!version) {
      dispatch(
        _fetchDiff({
          addonId: parseInt(addonId, 10),
          baseVersionId: oldVersionId,
          headVersionId: newVersionId,
          path: path || undefined,
        }),
      );
      return;
    }

    if (!prevProps) {
      if (path && path !== version.selectedPath) {
        // We preserve the hash in the URL (if any) when we load the file from
        // an URL that has likely be shared.
        this.viewVersionFile(path, { preserveHash: true });
      }
    } else if (
      (prevProps.version &&
        version.selectedPath !== prevProps.version.selectedPath) ||
      addonId !== prevProps.match.params.addonId ||
      baseVersionId !== prevProps.match.params.baseVersionId ||
      headVersionId !== prevProps.match.params.headVersionId
    ) {
      dispatch(
        _fetchDiff({
          addonId: parseInt(addonId, 10),
          baseVersionId: oldVersionId,
          headVersionId: newVersionId,
          path: version.selectedPath,
        }),
      );
    }
  }

  // When selecting a new file to view, we do not want to preserve the hash in
  // the URL (this hash highlights a specific line of code).
  viewVersionFile = (path: string, { preserveHash = false } = {}) => {
    const { _viewVersionFile, dispatch, match } = this.props;
    const { headVersionId } = match.params;

    dispatch(
      _viewVersionFile({
        selectedPath: path,
        versionId: parseInt(headVersionId, 10),
        preserveHash,
      }),
    );
  };

  renderLoadingMessageOrError(message: string) {
    const { isLoading } = this.props;

    if (!isLoading) {
      return (
        <p className={styles.error}>
          {gettext('Ooops, an error has occured.')}
        </p>
      );
    }

    return <Loading message={message} />;
  }

  render() {
    const { addonId, compareInfo, version } = this.props;

    return (
      <React.Fragment>
        <Col md="3">
          {version ? (
            <FileTree onSelect={this.viewVersionFile} versionId={version.id} />
          ) : (
            this.renderLoadingMessageOrError(gettext('Loading file tree...'))
          )}
        </Col>
        <Col md="9">
          <Row>
            <Col>
              <VersionChooser addonId={addonId} />
            </Col>
          </Row>
          <Row>
            <Col>
              {version && compareInfo ? (
                <DiffView
                  diffs={compareInfo.diffs}
                  mimeType={compareInfo.mimeType}
                  version={version}
                />
              ) : (
                this.renderLoadingMessageOrError(gettext('Loading diff...'))
              )}
            </Col>
          </Row>
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
  const addonId = parseInt(match.params.addonId, 10);
  const headVersionId = parseInt(match.params.headVersionId, 10);

  const { compareInfo } = state.versions;
  const isLoading = compareInfo === undefined;

  // The Compare API returns the version info of the head/newest version.
  const version = getVersionInfo(state.versions, headVersionId);

  return {
    addonId,
    compareInfo,
    isLoading,
    version,
  };
};

export default connect(mapStateToProps)(CompareBase);
