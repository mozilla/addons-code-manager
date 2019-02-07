import * as React from 'react';
import { RouteComponentProps } from 'react-router-dom';
import { connect } from 'react-redux';
import { Col } from 'react-bootstrap';
import Highlight from 'react-highlight';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { ApplicationState, ConnectedReduxProps } from '../../configureStore';
import { ApiState } from '../../reducers/api';
import * as api from '../../api';
import FileTree from '../../components/FileTree';
import {
  ExternalVersion,
  Version,
  VersionFile,
  actions as versionActions,
  getVersionFiles,
  getVersionInfo,
} from '../../reducers/versions';
import { gettext } from '../../utils';

import 'highlight.js/styles/github.css';

type PropsFromRouter = {
  addonId: string;
  versionId: string;
};

type PropsFromState = {
  apiState: ApiState;
  files: { [path: string]: VersionFile };
  version: Version;
};

/* eslint-disable @typescript-eslint/indent */
type Props = RouteComponentProps<PropsFromRouter> &
  PropsFromState &
  ConnectedReduxProps;
/* eslint-enable @typescript-eslint/indent */

export class BrowseBase extends React.Component<Props> {
  async componentDidMount() {
    const { apiState, dispatch, match } = this.props;
    const { addonId, versionId } = match.params;

    const response = (await api.getVersionFile({
      addonId: parseInt(addonId, 10),
      apiState,
      versionId: parseInt(versionId, 10),
    })) as ExternalVersion;

    if (response && response.id) {
      dispatch(versionActions.loadVersionInfo({ version: response }));
    }
  }

  onSelect = async (path: string) => {
    const { apiState, dispatch, match, files, version } = this.props;

    dispatch(versionActions.selectPath({ versionId: version.id, path }));

    if (!files[path]) {
      const { addonId } = match.params;

      const response = (await api.getVersionFile({
        addonId: parseInt(addonId, 10),
        apiState,
        path,
        versionId: version.id,
      })) as ExternalVersion;

      if (response && response.id) {
        dispatch(versionActions.loadVersionFile({ path, version: response }));
      }
    }
  };

  render() {
    const { files, version } = this.props;

    return version ? (
      <React.Fragment>
        <Col md="3">
          <FileTree version={version} onSelect={this.onSelect} />
        </Col>
        <Col md="9">
          {files[version.selectedPath] ? (
            <Highlight className="auto">
              {files[version.selectedPath].content}
            </Highlight>
          ) : (
            <FontAwesomeIcon icon="spinner" spin />
          )}
        </Col>
      </React.Fragment>
    ) : (
      <Col>
        <p>{gettext('Loading...')}</p>
      </Col>
    );
  }
}

const mapStateToProps = (
  state: ApplicationState,
  ownProps: RouteComponentProps<PropsFromRouter>,
): PropsFromState => {
  const { match } = ownProps;
  const { versionId } = match.params;

  const version = getVersionInfo(state.versions, parseInt(versionId, 10));
  const files = getVersionFiles(state.versions, parseInt(versionId, 10));

  return {
    apiState: state.api,
    version,
    files,
  };
};

export default connect(mapStateToProps)(BrowseBase);
