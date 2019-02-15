import * as React from 'react';
import { RouteComponentProps } from 'react-router-dom';
import { connect } from 'react-redux';
import { Col } from 'react-bootstrap';
import log from 'loglevel';

import { ApplicationState, ConnectedReduxProps } from '../../configureStore';
import { ApiState } from '../../reducers/api';
import { isErrorResponse, getVersion } from '../../api';
import FileTree from '../../components/FileTree';
import {
  actions as versionActions,
  Version,
  getVersionInfo,
} from '../../reducers/versions';

type PropsFromRouter = {
  addonId: string;
  versionId: string;
};

export type DefaultProps = {
  _log: typeof log;
};

type PropsFromState = {
  apiState: ApiState;
  version: Version;
};

/* eslint-disable @typescript-eslint/indent */
type Props = RouteComponentProps<PropsFromRouter> &
  PropsFromState &
  DefaultProps &
  ConnectedReduxProps;
/* eslint-enable @typescript-eslint/indent */

export class BrowseBase extends React.Component<Props> {
  static defaultProps = {
    _log: log,
  };

  async componentDidMount() {
    const { _log, apiState, dispatch, match } = this.props;
    const { addonId, versionId } = match.params;

    const response = await getVersion({
      addonId: parseInt(addonId, 10),
      apiState,
      versionId: parseInt(versionId, 10),
    });

    if (isErrorResponse(response)) {
      _log.error(`TODO: handle this error response: ${response.error}`);
    } else {
      dispatch(versionActions.loadVersionInfo({ version: response }));
    }
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
