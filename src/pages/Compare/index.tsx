import * as React from 'react';
import { Col, Row } from 'react-bootstrap';
import { RouteComponentProps } from 'react-router-dom';
import { connect } from 'react-redux';

import { ApplicationState, ConnectedReduxProps } from '../../configureStore';
import FileTree from '../../components/FileTree';
import DiffView from '../../components/DiffView';
import Loading from '../../components/Loading';
import VersionChooser from '../../components/VersionChooser';
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
  addonId: number;
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
    const { addonId, version } = this.props;

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
          <Row>
            <Col>
              <VersionChooser addonId={addonId} />
            </Col>
          </Row>
          <Row>
            <Col>
              <DiffView diff={diffWithDeletions} mimeType="text/javascript" />
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
  const baseVersionId = parseInt(match.params.baseVersionId, 10);

  const version = getVersionInfo(state.versions, baseVersionId);

  return {
    addonId,
    version,
  };
};

export default connect(mapStateToProps)(CompareBase);
