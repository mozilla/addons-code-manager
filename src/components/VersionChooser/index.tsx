import makeClassName from 'classnames';
import queryString from 'query-string';
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
  versionsMap: VersionsMap;
  versions: VersionsState;
  selectedPath: string | null;
};

type RouterProps = RouteComponentProps<{}>;

type Props = PublicProps &
  ConnectedReduxProps &
  DefaultProps &
  PropsFromState &
  RouterProps;

type State = {
  baseVersionId: number | undefined;
  headVersionId: number | undefined;
};

export class VersionChooserBase extends React.Component<Props, State> {
  static defaultProps: DefaultProps = {
    _fetchVersionsList: fetchVersionsList,
    _higherVersionsThan: higherVersionsThan,
    _lowerVersionsThan: lowerVersionsThan,
  };

  constructor(props: Props) {
    super(props);
    this.state = { baseVersionId: undefined, headVersionId: undefined };
  }

  componentDidMount() {
    const { _fetchVersionsList, addonId, dispatch, versionsMap } = this.props;

    if (!versionsMap) {
      dispatch(_fetchVersionsList({ addonId }));
    }

    this.initializeBaseVersion();
  }

  componentDidUpdate() {
    this.initializeBaseVersion();
  }

  initializeBaseVersion() {
    const { versionsMap } = this.props;

    if (this.getBaseVersionId()) {
      return;
    }

    const allBaseVersions = versionsMap
      ? versionsMap.listed.concat(versionsMap.unlisted)
      : [];

    if (allBaseVersions.length) {
      // When nothing in the base version dropdown is selected,
      // choose the last item in the dropdown, the lowest base version.
      this.setState({
        baseVersionId: allBaseVersions[allBaseVersions.length - 1].id,
      });
    }
  }

  getBaseVersionId() {
    const { currentBaseVersionId } = this.props;
    const { baseVersionId } = this.state;
    return baseVersionId || currentBaseVersionId;
  }

  getHeadVersionId() {
    const { currentVersionId } = this.props;
    const { headVersionId } = this.state;
    return headVersionId || currentVersionId;
  }

  onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const headVersionId = this.getHeadVersionId();
    const baseVersionId = this.getBaseVersionId();

    const { addonId, dispatch, history, selectedPath } = this.props;

    const query = selectedPath
      ? `?${queryString.stringify({ path: selectedPath })}`
      : '';

    dispatch(popoverActions.hide(POPOVER_ID));

    const lang = process.env.REACT_APP_DEFAULT_API_LANG;
    history.push(
      `/${lang}/compare/${addonId}/versions/${baseVersionId}...${headVersionId}/${query}`,
    );
  };

  onHeadVersionChange = (versionId: number) => {
    this.setState({ headVersionId: versionId });
  };

  onBaseVersionChange = (versionId: number) => {
    this.setState({ baseVersionId: versionId });
  };

  render() {
    const { _higherVersionsThan, _lowerVersionsThan, versionsMap } = this.props;
    const headVersionId = String(this.getHeadVersionId() || '');
    const baseVersionId = String(this.getBaseVersionId() || '');

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
  const { byAddonId, selectedPath } = state.versions;
  const { addonId } = ownProps;

  return {
    currentBaseVersionId: state.versions.currentBaseVersionId,
    currentVersionId: state.versions.currentVersionId,
    selectedPath,
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
