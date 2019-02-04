import * as React from 'react';
import { RouteComponentProps } from 'react-router-dom';

type BrowseRouterProps = {
  versionId: string;
};

export class BrowseBase extends React.Component<
  RouteComponentProps<BrowseRouterProps>
> {
  render() {
    return (
      <div>
        <p>Version ID: {this.props.match.params.versionId}</p>
      </div>
    );
  }
}

export default BrowseBase;
