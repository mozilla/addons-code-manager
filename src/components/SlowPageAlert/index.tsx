import queryString from 'query-string';
import * as React from 'react';
import { Alert } from 'react-bootstrap';
import { withRouter, RouteComponentProps } from 'react-router-dom';

import { allowSlowPagesParam, shouldAllowSlowPages } from '../../utils';

type GetTextForSlowState = (allowSlowPages: boolean) => string;

export type PublicProps = {
  _shouldAllowSlowPages?: typeof shouldAllowSlowPages;
  allowSlowPagesByDefault?: boolean;
  getLinkText: GetTextForSlowState;
  getMessage: GetTextForSlowState;
};

export type Props = PublicProps & RouteComponentProps;

export const SlowPageAlertBase = ({
  _shouldAllowSlowPages = shouldAllowSlowPages,
  allowSlowPagesByDefault,
  getLinkText,
  getMessage,
  history,
  location,
}: Props) => {
  const allowSlowPages = _shouldAllowSlowPages({
    allowByDefault: allowSlowPagesByDefault,
    location,
  });

  const onClick = () => {
    const newLocation = {
      ...location,
      search: queryString.stringify({
        ...queryString.parse(location.search),
        [allowSlowPagesParam]: !allowSlowPages,
      }),
    };
    history.push(newLocation);
  };

  return (
    <Alert variant="danger">
      {getMessage(allowSlowPages)}{' '}
      <Alert.Link onClick={onClick}>{getLinkText(allowSlowPages)}</Alert.Link>
    </Alert>
  );
};

export default withRouter(SlowPageAlertBase) as React.ComponentType<
  PublicProps
>;
