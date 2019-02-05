import * as React from 'react';
import { RouteComponentProps } from 'react-router-dom';
import { connect } from 'react-redux';
import { Col } from 'react-bootstrap';

import { ApplicationState, ConnectedReduxProps } from '../../configureStore';
import { ApiState } from '../../reducers/api';
import { callApi } from '../../api';
import FileTree from '../../components/FileTree';

type PropsFromRouter = {
  versionId: string;
};

type PropsFromState = {
  apiState: ApiState;
};

/* eslint-disable @typescript-eslint/indent */
type Props = RouteComponentProps<PropsFromRouter> &
  PropsFromState &
  ConnectedReduxProps;
/* eslint-enable @typescript-eslint/indent */

export class BrowseBase extends React.Component<Props> {
  state = {
    response: null,
  };

  async componentDidMount() {
    const { apiState, match } = this.props;
    const { versionId } = match.params;

    const response = await callApi({
      apiState,
      endpoint: `/reviewers/browse/${versionId}`,
    });

    this.setState({ response });
  }

  render() {
    const { response } = this.state;

    // @ts-ignore
    const showFileTree = response && !response.error;

    return (
      <React.Fragment>
        <Col md="3">
          {showFileTree && (
            <FileTree
              // @ts-ignore
              response={response}
            />
          )}
        </Col>
        <Col>
          <p>Version ID: {this.props.match.params.versionId}</p>
        </Col>
      </React.Fragment>
    );
  }
}

const mapStateToProps = (state: ApplicationState): PropsFromState => {
  return {
    apiState: state.api,
  };
};

export default connect(mapStateToProps)(BrowseBase);
