import * as React from 'react';
import makeClassName from 'classnames';
import { connect } from 'react-redux';

import { ThunkDispatch } from '../../configureStore';
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
  mainSidePanelIsExpanded: boolean;
};

type DispatchProps = {
  toggleMainSidePanel: () => void;
};

type Props = PublicProps & PropsFromState & DispatchProps;

export const ContentShellBase = ({
  altSidePanel,
  altSidePanelClass,
  children,
  className,
  mainSidePanel,
  mainSidePanelClass,
  mainSidePanelIsExpanded,
  toggleMainSidePanel,
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
          onClick={toggleMainSidePanel}
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
      <aside className={makeClassName(styles.altSidePanel, altSidePanelClass)}>
        {altSidePanel}
      </aside>
    </React.Fragment>
  );
};

const mapStateToProps = (state: ApplicationState): PropsFromState => {
  return {
    mainSidePanelIsExpanded: state.fullscreenGrid.mainSidePanelIsExpanded,
  };
};

const mapDispatchToProps = (dispatch: ThunkDispatch): DispatchProps => {
  return {
    toggleMainSidePanel: () => dispatch(actions.toggleMainSidePanel()),
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(ContentShellBase);
