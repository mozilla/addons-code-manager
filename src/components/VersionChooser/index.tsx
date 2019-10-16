import queryString from 'query-string';
import * as React from 'react';
import { Form } from 'react-bootstrap';
import { connect } from 'react-redux';
import { withRouter, RouteComponentProps } from 'react-router-dom';

import { ApplicationState } from '../../reducers';
import { ConnectedReduxProps } from '../../configureStore';
import VersionSelect from '../VersionSelect';
import {
  VersionsListItem,
  VersionsMap,
  VersionsState,
  fetchVersionsList,
} from '../../reducers/versions';
import { gettext } from '../../utils';
import styles from './styles.module.scss';

export const higherVersionsThan = (versionId: string) => {
  return (version: VersionsListItem) => version.id > parseInt(versionId, 10);
};

export const lowerVersionsThan = (versionId: string) => {
  return (version: VersionsListItem) => version.id < parseInt(versionId, 10);
};

export type PublicProps = {
  addonId: number;
};

export type DefaultProps = {
  _fetchVersionsList: typeof fetchVersionsList;
  _higherVersionsThan: typeof higherVersionsThan;
  _lowerVersionsThan: typeof lowerVersionsThan;
};

type PropsFromState = {
  versionsMap: VersionsMap;
  versions: VersionsState;
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
    _higherVersionsThan: higherVersionsThan,
    _lowerVersionsThan: lowerVersionsThan,
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
    const { addonId, history, match, versions } = this.props;
    const { lang } = match.params;
    const { selectedPath } = versions;
    const query = selectedPath
      ? `?${queryString.stringify({ path: selectedPath })}`
      : '';

    history.push(
      `/${lang}/compare/${addonId}/versions/${baseVersionId}...${headVersionId}/${query}`,
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
    const {
      _higherVersionsThan,
      _lowerVersionsThan,
      match,
      versionsMap,
    } = this.props;
    const { baseVersionId, headVersionId } = match.params;

    const listedVersions = versionsMap ? versionsMap.listed : [];
    const unlistedVersions = versionsMap ? versionsMap.unlisted : [];

    return (
      <div className={styles.VersionChooser}>
        <Form className={styles.form}>
          <VersionSelect
            className={styles.baseVersionSelect}
            controlId="VersionSelect-oldVersion"
            isLoading={!versionsMap}
            isSelectable={_lowerVersionsThan(headVersionId)}
            label={gettext('Old version')}
            listedVersions={listedVersions}
            onChange={this.onOldVersionChange}
            unlistedVersions={unlistedVersions}
            value={baseVersionId}
          />

          <VersionSelect
            className={styles.headVersionSelect}
            controlId="VersionSelect-newVersion"
            isLoading={!versionsMap}
            isSelectable={_higherVersionsThan(baseVersionId)}
            label={gettext('New version')}
            listedVersions={listedVersions}
            onChange={this.onNewVersionChange}
            unlistedVersions={unlistedVersions}
            value={headVersionId}
            withLeftArrow
          />
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
    versions: state.versions,
    versionsMap: byAddonId[addonId],
  };
};

const ConnectedVersionChooser = connect(mapStateToProps)(VersionChooserBase);

// We have to export this class to tell Storybook that it's okay to inject the
// router props directly. That's because we want to by-pass the `withRouter()`
// HOC, which requires a `Router` and a `Route` and we don't want that in
// Storybook.
export const VersionChooserWithoutRouter = ConnectedVersionChooser as React.ComponentType<
  PublicProps & Partial<DefaultProps & RouterProps>
>;

export default withRouter<PublicProps & Partial<DefaultProps> & RouterProps>(
  ConnectedVersionChooser,
);
