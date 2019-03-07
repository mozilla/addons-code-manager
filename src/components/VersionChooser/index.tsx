import * as React from 'react';
import { Col, Form, Row } from 'react-bootstrap';
import { connect } from 'react-redux';

import Loading from '../Loading';
import { ApplicationState, ConnectedReduxProps } from '../../configureStore';
import VersionSelect from '../VersionSelect';
import { VersionsMap, fetchVersionsList } from '../../reducers/versions';
import { gettext } from '../../utils';
import styles from './styles.module.scss';

export type PublicProps = {
  _fetchVersionsList: typeof fetchVersionsList;
  addonId: number;
};

type PropsFromState = {
  versionsMap: VersionsMap;
};

type Props = PropsFromState & PublicProps & ConnectedReduxProps;

export class VersionChooserBase extends React.Component<Props> {
  static defaultProps = {
    _fetchVersionsList: fetchVersionsList,
  };

  componentDidMount() {
    const { _fetchVersionsList, addonId, dispatch, versionsMap } = this.props;

    if (!versionsMap) {
      dispatch(_fetchVersionsList({ addonId }));
    }
  }

  render() {
    const { versionsMap } = this.props;

    return (
      <div className={styles.VersionChooser}>
        <Form>
          <Row className={styles.heading}>
            <Col>
              <h3>{gettext('Compare changes')}</h3>
            </Col>
          </Row>

          {versionsMap ? (
            <Form.Row>
              <VersionSelect
                label={gettext('Choose an old version')}
                listedVersions={versionsMap.listed}
                unlistedVersions={versionsMap.unlisted}
              />

              <VersionSelect
                label={gettext('Choose a new version')}
                listedVersions={versionsMap.listed}
                unlistedVersions={versionsMap.unlisted}
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
  const versionsMap = state.versions.byAddonId[ownProps.addonId];

  return {
    versionsMap,
  };
};

export default connect(mapStateToProps)(VersionChooserBase);
