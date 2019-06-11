import * as React from 'react';
import makeClassName from 'classnames';
import { connect } from 'react-redux';

import { ApplicationState } from '../../reducers';
import { AnyReactNode } from '../../typeUtils';
import styles from './styles.module.scss';

type PropsFromState = {
  altSidePanelIsExpanded: boolean;
  mainSidePanelIsExpanded: boolean;
};

type PublicProps = {
  children?: AnyReactNode;
  className?: string;
};

type Props = PublicProps & PropsFromState;

export enum PanelAttribs {
  altSidePanel = 'altSidePanel',
  mainSidePanel = 'mainSidePanel',
}

export const Header = ({
  children,
  className,
}: {
  children?: AnyReactNode;
  className?: string;
}) => {
  return (
    <header className={makeClassName(styles.Header, className)}>
      {children}
    </header>
  );
};

export const FullscreenGridBase = ({
  children,
  className,
  altSidePanelIsExpanded,
  mainSidePanelIsExpanded,
}: Props) => {
  return (
    <div
      className={makeClassName(
        styles.FullscreenGrid,
        {
          [styles.withMainSidePanelCollapsed]:
            !mainSidePanelIsExpanded && altSidePanelIsExpanded,
          [styles.withAltSidePanelCollapsed]:
            mainSidePanelIsExpanded && !altSidePanelIsExpanded,
          [styles.withBothSidePanelsCollapsed]:
            !mainSidePanelIsExpanded && !altSidePanelIsExpanded,
        },
        className,
      )}
    >
      {children}
    </div>
  );
};

const mapStateToProps = (state: ApplicationState): PropsFromState => {
  return {
    altSidePanelIsExpanded: state.fullscreenGrid.altSidePanelIsExpanded,
    mainSidePanelIsExpanded: state.fullscreenGrid.mainSidePanelIsExpanded,
  };
};

export default connect(mapStateToProps)(FullscreenGridBase);
