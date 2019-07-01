import * as React from 'react';
import makeClassName from 'classnames';
import { connect } from 'react-redux';

import { ConnectedReduxProps } from '../../configureStore';
import { ApplicationState } from '../../reducers';
import { actions } from '../../reducers/fullscreenGrid';
import { AnyReactNode } from '../../typeUtils';
import SidePanel from '../SidePanel';
import styles from './styles.module.scss';

export type PublicProps = {
  altSidePanel?: AnyReactNode;
  altSidePanelClass?: string;
  children?: AnyReactNode;
  className?: string;
  mainSidePanel?: AnyReactNode;
  mainSidePanelClass?: string;
  topContent?: AnyReactNode;
};

type PropsFromState = {
  altSidePanelIsExpanded: boolean;
  mainSidePanelIsExpanded: boolean;
};

type Props = PublicProps & PropsFromState & ConnectedReduxProps;

export enum PanelAttribs {
  altSidePanel = 'altSidePanel',
  mainSidePanel = 'mainSidePanel',
  topContent = 'topContent',
}

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
  topContent,
}: Props) => {
  return (
    <React.Fragment>
      {topContent ? (
        <div className={styles.topContent}>{topContent}</div>
      ) : null}

      <SidePanel
        className={makeClassName(styles.mainSidePanel, mainSidePanelClass)}
        isExpanded={mainSidePanelIsExpanded}
        onClick={() => dispatch(actions.toggleMainSidePanel())}
        toggleLeft={mainSidePanelIsExpanded}
      >
        {mainSidePanel}
      </SidePanel>

      <main className={makeClassName(styles.content, className)}>
        {children}
      </main>

      <SidePanel
        className={makeClassName(styles.altSidePanel, altSidePanelClass)}
        isExpanded={altSidePanelIsExpanded}
        onClick={() => dispatch(actions.toggleAltSidePanel())}
        toggleLeft={!altSidePanelIsExpanded}
      >
        {altSidePanel}
      </SidePanel>
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
