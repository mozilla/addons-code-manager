import * as React from 'react';
import { Col } from 'react-bootstrap';
import { RouteComponentProps } from 'react-router-dom';
import { connect } from 'react-redux';

import { ApplicationState, ConnectedReduxProps } from '../../configureStore';
import { ApiState } from '../../reducers/api';
import FileTree from '../../components/FileTree';
import DiffView from '../../components/DiffView';
import Loading from '../../components/Loading';
import { Version, fetchVersion, getVersionInfo } from '../../reducers/versions';
import { gettext } from '../../utils';
import diffWithDeletions from '../../components/DiffView/fixtures/diffWithDeletions';

export type PublicProps = {
  _fetchVersion: typeof fetchVersion;
};

type PropsFromRouter = {
  addonId: string;
  baseVersionId: string;
  headVersionId: string;
};

type PropsFromState = {
  apiState: ApiState;
  version: Version;
};

type Props = RouteComponentProps<PropsFromRouter> &
  PropsFromState &
  PublicProps &
  ConnectedReduxProps;

export class CompareBase extends React.Component<Props> {
  static defaultProps = {
    _fetchVersion: fetchVersion,
  };

  componentDidMount() {
    const { _fetchVersion, dispatch, match } = this.props;
    const { addonId, baseVersionId } = match.params;

    dispatch(
      _fetchVersion({
        addonId: parseInt(addonId, 10),
        versionId: parseInt(baseVersionId, 10),
      }),
    );
  }

  onSelectFile = () => {};

  render() {
    const { version } = this.props;

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
          <DiffView diff={diffWithDeletions} mimeType="text/javascript" />
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
  const baseVersionId = parseInt(match.params.baseVersionId, 10);

  const version = getVersionInfo(state.versions, baseVersionId);

  return {
    apiState: state.api,
    version,
  };
};

export default connect(mapStateToProps)(CompareBase);
