import * as React from 'react';
import { Col, Row } from 'react-bootstrap';
import { RouteComponentProps } from 'react-router-dom';
import { connect } from 'react-redux';

import { ApplicationState, ConnectedReduxProps } from '../../configureStore';
import FileTree from '../../components/FileTree';
import DiffView from '../../components/DiffView';
import Loading from '../../components/Loading';
import VersionChooser from '../../components/VersionChooser';
import {
  CompareInfo,
  Version,
  actions,
  fetchDiff,
  getVersionInfo,
} from '../../reducers/versions';
import { gettext } from '../../utils';
import styles from './styles.module.scss';

export type PublicProps = {
  _fetchDiff: typeof fetchDiff;
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
  path: string | void;
  version: Version;
};

type Props = RouteComponentProps<PropsFromRouter> &
  PropsFromState &
  PublicProps &
  ConnectedReduxProps;

export class CompareBase extends React.Component<Props> {
  static defaultProps = {
    _fetchDiff: fetchDiff,
  };

  componentDidMount() {
    const { history, match } = this.props;
    const { lang, addonId, baseVersionId, headVersionId } = match.params;

    const oldVersionId = parseInt(baseVersionId, 10);
    const newVersionId = parseInt(headVersionId, 10);

    // We ensure the new version ID is newer than the old version ID.
    if (oldVersionId > newVersionId) {
      history.push(
        `/${lang}/compare/${addonId}/versions/${headVersionId}...${baseVersionId}/`,
      );
      return;
    }

    this.loadData();
  }

  componentDidUpdate(prevProps: Props) {
    this.loadData(prevProps);
  }

  loadData(prevProps?: Props) {
    const { match, path } = this.props;
    const { addonId, baseVersionId, headVersionId } = match.params;

    if (
      !prevProps ||
      path !== prevProps.path ||
      addonId !== prevProps.match.params.addonId ||
      baseVersionId !== prevProps.match.params.baseVersionId ||
      headVersionId !== prevProps.match.params.headVersionId
    ) {
      const { dispatch, _fetchDiff } = this.props;

      dispatch(
        _fetchDiff({
          addonId: parseInt(addonId, 10),
          baseVersionId: parseInt(baseVersionId, 10),
          headVersionId: parseInt(headVersionId, 10),
          path: path || undefined,
        }),
      );
    }
  }

  onSelectFile = (path: string) => {
    const { dispatch, match } = this.props;
    const { headVersionId } = match.params;

    dispatch(
      actions.updateSelectedPath({
        selectedPath: path,
        versionId: parseInt(headVersionId, 10),
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
            <FileTree version={version} onSelect={this.onSelectFile} />
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
              {compareInfo ? (
                <DiffView
                  diffs={compareInfo.diffs}
                  mimeType={compareInfo.mimeType}
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
    path: version && version.selectedPath,
    version,
  };
};

export default connect(mapStateToProps)(CompareBase);
