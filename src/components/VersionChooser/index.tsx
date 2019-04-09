import * as React from 'react';
import { Col, Form, Row } from 'react-bootstrap';
import { connect } from 'react-redux';
import { withRouter, RouteComponentProps } from 'react-router-dom';

import Loading from '../Loading';
import { ApplicationState } from '../../reducers';
import { ConnectedReduxProps } from '../../configureStore';
import VersionSelect from '../VersionSelect';
import { VersionsMap, fetchVersionsList } from '../../reducers/versions';
import { gettext } from '../../utils';
import styles from './styles.module.scss';

export type PublicProps = {
  addonId: number;
};

export type DefaultProps = {
  _fetchVersionsList: typeof fetchVersionsList;
};

type PropsFromState = {
  versionsMap: VersionsMap;
};

export type PropsFromRouter = {
  baseVersionId: string;
  headVersionId: string;
  lang: string;
};

type RouterProps = RouteComponentProps<PropsFromRouter>;

type Props = PublicProps &
  ConnectedReduxProps &
  DefaultProps &
  PropsFromState &
  RouterProps;

export class VersionChooserBase extends React.Component<Props> {
  static defaultProps: DefaultProps = {
    _fetchVersionsList: fetchVersionsList,
  };

  componentDidMount() {
    const { _fetchVersionsList, addonId, dispatch, versionsMap } = this.props;

    if (!versionsMap) {
      dispatch(_fetchVersionsList({ addonId }));
    }
  }

  onVersionChange = ({
    baseVersionId,
    headVersionId,
  }: {
    baseVersionId: string;
    headVersionId: string;
  }) => {
    const { addonId, history, match } = this.props;
    const { lang } = match.params;

    history.push(
      `/${lang}/compare/${addonId}/versions/${baseVersionId}...${headVersionId}/`,
    );
  };

  onNewVersionChange = (versionId: string) => {
    const { baseVersionId } = this.props.match.params;
    this.onVersionChange({ baseVersionId, headVersionId: versionId });
  };

  onOldVersionChange = (versionId: string) => {
    const { headVersionId } = this.props.match.params;
    this.onVersionChange({ baseVersionId: versionId, headVersionId });
  };

  render() {
    const { match, versionsMap } = this.props;
    const { baseVersionId, headVersionId } = match.params;

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
                className={styles.baseVersionSelect}
                label={gettext('Choose an old version')}
                listedVersions={versionsMap.listed}
                onChange={this.onOldVersionChange}
                unlistedVersions={versionsMap.unlisted}
                value={baseVersionId}
              />

              <VersionSelect
                className={styles.headVersionSelect}
                label={gettext('Choose a new version')}
                listedVersions={versionsMap.listed}
                onChange={this.onNewVersionChange}
                unlistedVersions={versionsMap.unlisted}
                value={headVersionId}
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
  const { byAddonId } = state.versions;
  const { addonId } = ownProps;

  return {
    versionsMap: byAddonId[addonId],
  };
};

export default withRouter<PublicProps & Partial<DefaultProps> & RouterProps>(
  connect(mapStateToProps)(VersionChooserBase),
);
