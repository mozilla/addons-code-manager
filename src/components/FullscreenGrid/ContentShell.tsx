import * as React from 'react';
import makeClassName from 'classnames';
import { connect } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { ThunkDispatch } from '../../configureStore';
import { ApplicationState } from '../../reducers';
import { actions } from '../../reducers/fullscreenGrid';
import { AnyReactNode } from '../../typeUtils';
import { gettext } from '../../utils';
import styles from './styles.module.scss';

type ToggleButtonProps = {
  label?: string;
  onClick: () => void;
  toggleLeft?: boolean;
};

const ToggleButton = ({
  label,
  onClick,
  toggleLeft = false,
}: ToggleButtonProps) => {
  return (
    <button
      className={styles.ToggleButton}
      onClick={onClick}
      title={gettext('Toggle this panel')}
      type="button"
    >
      <FontAwesomeIcon
        icon={toggleLeft ? 'angle-double-left' : 'angle-double-right'}
      />
      {label ? ` ${label}` : null}
    </button>
  );
};

type PublicProps = {
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
            [styles.isCollapsed]: !mainSidePanelIsExpanded,
          },
          mainSidePanelClass,
        )}
      >
        {mainSidePanelIsExpanded ? (
          <React.Fragment>
            <div className={styles.mainSidePanelContent}>{mainSidePanel}</div>
            <div className={styles.mainSidePanelCollapseButton}>
              <ToggleButton
                label={gettext('Collapse this panel')}
                onClick={toggleMainSidePanel}
                toggleLeft
              />
            </div>
          </React.Fragment>
        ) : (
          <ToggleButton onClick={toggleMainSidePanel} />
        )}
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
