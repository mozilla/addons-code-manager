import makeClassName from 'classnames';
import * as React from 'react';
import { Button, Form } from 'react-bootstrap';
import { connect } from 'react-redux';
import { withRouter, RouteComponentProps } from 'react-router-dom';

import { ApplicationState } from '../../reducers';
import { ConnectedReduxProps } from '../../configureStore';
import PopoverButton from '../PopoverButton';
import VersionSelect from '../VersionSelect';
import {
  actions as popoverActions,
  PopoverIdType,
} from '../../reducers/popover';
import {
  actions as versionsActions,
  VersionsListItem,
  VersionsMap,
  VersionsState,
  fetchVersionsList,
} from '../../reducers/versions';
import { gettext } from '../../utils';
import styles from './styles.module.scss';

export const POPOVER_ID: PopoverIdType = 'COMPARE_VERSIONS';

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
  currentBaseVersionId: number | undefined | false;
  currentVersionId: number | undefined | false;
  pendingBaseVersionId: number | undefined;
  pendingHeadVersionId: number | undefined;
  versionsMap: VersionsMap;
  versions: VersionsState;
};

type RouterProps = RouteComponentProps<Record<string, string | undefined>>;

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

    this.synchronize();
  }

  componentDidUpdate() {
    this.synchronize();
  }

  synchronize() {
    const {
      currentBaseVersionId,
      currentVersionId,
      dispatch,
      pendingBaseVersionId,
      pendingHeadVersionId,
      versionsMap,
    } = this.props;

    if (pendingBaseVersionId === undefined && currentBaseVersionId) {
      dispatch(
        versionsActions.setPendingBaseVersionId({
          versionId: currentBaseVersionId,
        }),
      );
      return;
    }

    if (pendingHeadVersionId === undefined && currentVersionId) {
      dispatch(
        versionsActions.setPendingHeadVersionId({
          versionId: currentVersionId,
        }),
      );
      return;
    }

    if (pendingBaseVersionId) {
      return;
    }

    const allBaseVersions = versionsMap
      ? versionsMap.listed.concat(versionsMap.unlisted)
      : [];

    if (allBaseVersions.length) {
      // When nothing in the base version dropdown is selected,
      // choose the last item in the dropdown, the lowest base version.
      dispatch(
        versionsActions.setPendingBaseVersionId({
          versionId: allBaseVersions[allBaseVersions.length - 1].id,
        }),
      );
    }
  }

  addLocationQueryString(url: string) {
    const { history } = this.props;
    if (!url.endsWith('/')) {
      // This is probably a URL with an existing query string.
      // We do not currently need to support this.
      throw new Error(`The URL '${url}' must end in a trailing slash`);
    }
    return `${url}${history.location.search}`;
  }

  onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const {
      addonId,
      dispatch,
      history,
      pendingBaseVersionId,
      pendingHeadVersionId,
    } = this.props;

    dispatch(popoverActions.hide(POPOVER_ID));

    const lang = process.env.REACT_APP_DEFAULT_API_LANG;
    history.push(
      this.addLocationQueryString(
        `/${lang}/compare/${addonId}/versions/${pendingBaseVersionId}...${pendingHeadVersionId}/`,
      ),
    );
  };

  onHeadVersionChange = (versionId: number) => {
    const { dispatch } = this.props;
    dispatch(versionsActions.setPendingHeadVersionId({ versionId }));
  };

  onBaseVersionChange = (versionId: number) => {
    const { dispatch } = this.props;
    dispatch(versionsActions.setPendingBaseVersionId({ versionId }));
  };

  renderBrowseButton(versionId: string) {
    const { addonId, dispatch, history } = this.props;
    const lang = process.env.REACT_APP_DEFAULT_API_LANG;
    const href = versionId
      ? this.addLocationQueryString(
          `/${lang}/browse/${addonId}/versions/${versionId}/`,
        )
      : undefined;

    return (
      <Button
        disabled={!versionId}
        onClick={(event: React.FormEvent<HTMLButtonElement>) => {
          event.preventDefault();
          event.stopPropagation();
          dispatch(popoverActions.hide(POPOVER_ID));
          if (href) {
            history.push(href);
          }
        }}
        href={href}
      >
        {gettext('Browse')}
      </Button>
    );
  }

  render() {
    const {
      _higherVersionsThan,
      _lowerVersionsThan,
      pendingBaseVersionId,
      pendingHeadVersionId,
      versionsMap,
    } = this.props;
    const headVersionId = String(pendingHeadVersionId || '');
    const baseVersionId = String(pendingBaseVersionId || '');

    const listedVersions = versionsMap ? versionsMap.listed : [];
    const unlistedVersions = versionsMap ? versionsMap.unlisted : [];

    const isLoading = !versionsMap;

    return (
      <PopoverButton
        id={POPOVER_ID}
        content={
          <Form className={styles.VersionChooser} onSubmit={this.onSubmit}>
            <div className={styles.formRow}>
              <VersionSelect
                className={makeClassName(
                  styles.versionSelect,
                  styles.baseVersionSelect,
                )}
                controlId="VersionSelect-oldVersion"
                formControlClassName={styles.versionSelectControl}
                isLoading={isLoading}
                isSelectable={_lowerVersionsThan(headVersionId)}
                label={gettext('Old version')}
                listedVersions={listedVersions}
                onChange={this.onBaseVersionChange}
                unlistedVersions={unlistedVersions}
                value={baseVersionId}
              />
              {this.renderBrowseButton(baseVersionId)}
            </div>

            <div className={styles.formRow}>
              <VersionSelect
                className={makeClassName(
                  styles.versionSelect,
                  styles.headVersionSelect,
                )}
                controlId="VersionSelect-newVersion"
                formControlClassName={styles.versionSelectControl}
                isLoading={isLoading}
                isSelectable={_higherVersionsThan(baseVersionId)}
                label={gettext('New version')}
                listedVersions={listedVersions}
                onChange={this.onHeadVersionChange}
                unlistedVersions={unlistedVersions}
                value={headVersionId}
              />
              {this.renderBrowseButton(headVersionId)}
            </div>

            <Button
              className={styles.submitButton}
              disabled={baseVersionId === headVersionId}
              type="submit"
              variant="primary"
            >
              {gettext('Compare')}
            </Button>
          </Form>
        }
        popoverClassName={styles.popover}
        prompt={gettext('Compare Versions')}
      />
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
    currentBaseVersionId: state.versions.currentBaseVersionId,
    currentVersionId: state.versions.currentVersionId,
    pendingBaseVersionId: state.versions.pendingBaseVersionId,
    pendingHeadVersionId: state.versions.pendingHeadVersionId,
    versions: state.versions,
    versionsMap: byAddonId[addonId],
  };
};

const ConnectedVersionChooser = connect(mapStateToProps)(VersionChooserBase);

export default withRouter(ConnectedVersionChooser) as React.ComponentType<
  PublicProps & Partial<DefaultProps>
>;
