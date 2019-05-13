import * as React from 'react';
import makeClassName from 'classnames';
import { connect } from 'react-redux';

import { ConnectedReduxProps } from '../../configureStore';
import { ApplicationState } from '../../reducers';
import { actions } from '../../reducers/fullscreenGrid';
import { AnyReactNode } from '../../typeUtils';
import { gettext } from '../../utils';
import ToggleButton from '../ToggleButton';
import styles from './styles.module.scss';

export type PublicProps = {
  altSidePanel?: AnyReactNode;
  altSidePanelClass?: string;
  children?: AnyReactNode;
  className?: string;
  mainSidePanel?: AnyReactNode;
  mainSidePanelClass?: string;
};

type PropsFromState = {
  altSidePanelIsExpanded: boolean;
  mainSidePanelIsExpanded: boolean;
};

type Props = PublicProps & PropsFromState & ConnectedReduxProps;

export const ContentShellBase = ({
  altSidePanel,
  altSidePanelClass,
  altSidePanelIsExpanded,
  children,
  className,
  dispatch,
  mainSidePanel,
  mainSidePanelClass,
  mainSidePanelIsExpanded,
}: Props) => {
  return (
    <React.Fragment>
      <aside
        aria-expanded={mainSidePanelIsExpanded ? 'true' : 'false'}
        className={makeClassName(
          styles.mainSidePanel,
          {
            [styles.mainSidePanelIsCollapsed]: !mainSidePanelIsExpanded,
          },
          mainSidePanelClass,
        )}
      >
        <div className={styles.mainSidePanelContent}>{mainSidePanel}</div>
        <ToggleButton
          className={styles.mainSidePanelToggleButton}
          label={
            mainSidePanelIsExpanded ? gettext('Collapse this panel') : null
          }
          onClick={() => dispatch(actions.toggleMainSidePanel())}
          title={
            mainSidePanelIsExpanded
              ? gettext('Collapse this panel')
              : gettext('Expand this panel')
          }
          toggleLeft={mainSidePanelIsExpanded}
        />
      </aside>

      <main className={makeClassName(styles.content, className)}>
        {children}
      </main>

      <aside
        aria-expanded={altSidePanelIsExpanded ? 'true' : 'false'}
        className={makeClassName(
          styles.altSidePanel,
          {
            [styles.altSidePanelIsCollapsed]: !altSidePanelIsExpanded,
          },
          altSidePanelClass,
        )}
      >
        <div className={styles.altSidePanelContent}>{altSidePanel}</div>
        <ToggleButton
          className={styles.altSidePanelToggleButton}
          label={altSidePanelIsExpanded ? gettext('Collapse') : null}
          onClick={() => dispatch(actions.toggleAltSidePanel())}
          title={
            altSidePanelIsExpanded
              ? gettext('Collapse this panel')
              : gettext('Expand this panel')
          }
          toggleLeft={!altSidePanelIsExpanded}
        />
      </aside>
    </React.Fragment>
  );
};

const mapStateToProps = (state: ApplicationState): PropsFromState => {
  return {
    altSidePanelIsExpanded: state.fullscreenGrid.altSidePanelIsExpanded,
    mainSidePanelIsExpanded: state.fullscreenGrid.mainSidePanelIsExpanded,
  };
};

export default connect(mapStateToProps)(ContentShellBase);
