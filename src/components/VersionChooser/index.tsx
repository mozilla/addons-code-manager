import * as React from 'react';
import { Col, Form, Row } from 'react-bootstrap';
import { connect } from 'react-redux';

import Loading from '../Loading';
import { ApplicationState, ConnectedReduxProps } from '../../configureStore';
import VersionSelect from '../VersionSelect';
import { VersionsLists, fetchVersionsList } from '../../reducers/versions';
import { gettext } from '../../utils';
import styles from './styles.module.scss';

export type PublicProps = {
  _fetchVersionsList: typeof fetchVersionsList;
  addonId: number;
};

type PropsFromState = {
  versionsLists: VersionsLists;
};

type Props = PropsFromState & PublicProps & ConnectedReduxProps;

export class VersionChooserBase extends React.Component<Props> {
  static defaultProps = {
    _fetchVersionsList: fetchVersionsList,
  };

  componentDidMount() {
    const { _fetchVersionsList, addonId, dispatch, versionsLists } = this.props;

    if (!versionsLists) {
      dispatch(_fetchVersionsList({ addonId }));
    }
  }

  render() {
    const { versionsLists } = this.props;

    return (
      <div className={styles.VersionChooser}>
        <Form>
          <Row className={styles.heading}>
            <Col>
              <h3>{gettext('Compare changes')}</h3>
            </Col>
          </Row>

          {versionsLists ? (
            <Form.Row>
              <VersionSelect
                label={gettext('Choose an old version')}
                listedVersions={versionsLists.listed}
                unlistedVersions={versionsLists.unlisted}
              />

              <VersionSelect
                label={gettext('Choose a new version')}
                listedVersions={versionsLists.listed}
                unlistedVersions={versionsLists.unlisted}
                withLeftArrow
              />
            </Form.Row>
          ) : (
            <Loading
              message={gettext('Retrieving all the versions of this add-on...')}
            />
          )}
        </Form>
      </div>
    );
  }
}

const mapStateToProps = (
  state: ApplicationState,
  ownProps: PublicProps,
): PropsFromState => {
  const versionsLists = state.versions.byAddonId[ownProps.addonId];

  return {
    versionsLists,
  };
};

export default connect(mapStateToProps)(VersionChooserBase);
