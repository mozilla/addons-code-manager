import * as React from 'react';
import { RouteComponentProps } from 'react-router-dom';
import { connect } from 'react-redux';
import { Col } from 'react-bootstrap';
import log from 'loglevel';

import { ApplicationState, ConnectedReduxProps } from '../../configureStore';
import { ApiState } from '../../reducers/api';
import FileTree from '../../components/FileTree';
import { Version, fetchVersion, getVersionInfo } from '../../reducers/versions';

export type PublicProps = {
  _fetchVersion: typeof fetchVersion;
  _log: typeof log;
};

type PropsFromRouter = {
  addonId: string;
  versionId: string;
};

type PropsFromState = {
  apiState: ApiState;
  version: Version;
};

/* eslint-disable @typescript-eslint/indent */
type Props = RouteComponentProps<PropsFromRouter> &
  PropsFromState &
  PublicProps &
  ConnectedReduxProps;
/* eslint-enable @typescript-eslint/indent */

export class BrowseBase extends React.Component<Props> {
  static defaultProps = {
    _fetchVersion: fetchVersion,
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

  render() {
    const { version } = this.props;

    return (
      <React.Fragment>
        <Col md="3">{version && <FileTree version={version} />}</Col>
        <Col>
          <p>Version ID: {this.props.match.params.versionId}</p>
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
  const { versionId } = match.params;

  return {
    apiState: state.api,
    version: getVersionInfo(state.versions, parseInt(versionId, 10)),
  };
};

export default connect(mapStateToProps)(BrowseBase);
