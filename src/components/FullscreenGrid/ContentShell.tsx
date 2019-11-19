import * as React from 'react';
import makeClassName from 'classnames';
import { connect } from 'react-redux';
import { withRouter, RouteComponentProps } from 'react-router-dom';

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
  mainSidePanelIsBorderless?: boolean;
  topContent?: AnyReactNode;
};

type PropsFromState = {
  altSidePanelIsExpanded: boolean;
  mainSidePanelIsExpanded: boolean;
};

type Props = PublicProps &
  PropsFromState &
  ConnectedReduxProps &
  RouteComponentProps;

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
  location,
  mainSidePanel,
  mainSidePanelClass,
  mainSidePanelIsBorderless = false,
  mainSidePanelIsExpanded,
  topContent,
}: Props) => {
  return (
    <>
      {topContent ? (
        <div className={styles.topContent}>{topContent}</div>
      ) : null}

      <SidePanel
        borderless={mainSidePanelIsBorderless}
        className={makeClassName(styles.mainSidePanel, mainSidePanelClass)}
        isExpanded={mainSidePanelIsExpanded}
        onClick={() => dispatch(actions.toggleMainSidePanel())}
        toggleLeft={mainSidePanelIsExpanded}
      >
        {mainSidePanel}
      </SidePanel>

      <main
        className={makeClassName(styles.content, className)}
        // This resets the dom node (thus scrollbars) when the location
        // changes.
        key={location.key}
      >
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
    </>
  );
};

const mapStateToProps = (state: ApplicationState): PropsFromState => {
  return {
    altSidePanelIsExpanded: state.fullscreenGrid.altSidePanelIsExpanded,
    mainSidePanelIsExpanded: state.fullscreenGrid.mainSidePanelIsExpanded,
  };
};

export default withRouter(
  connect(mapStateToProps)(ContentShellBase),
) as React.ComponentType<PublicProps>;
