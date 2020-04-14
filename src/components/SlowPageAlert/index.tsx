import { History, Location } from 'history';
import queryString from 'query-string';
import * as React from 'react';
import { Alert } from 'react-bootstrap';

import { allowSlowPagesParam, shouldAllowSlowPages } from '../../utils';

type GetTextForSlowState = (allowSlowPages: boolean) => string;

export type PublicProps = {
  _shouldAllowSlowPages?: typeof shouldAllowSlowPages;
  allowSlowPagesByDefault?: boolean;
  getLinkText: GetTextForSlowState;
  getMessage: GetTextForSlowState;
  history: History;
  location: Location;
};

const SlowPageAlertBase = ({
  _shouldAllowSlowPages = shouldAllowSlowPages,
  allowSlowPagesByDefault,
  getLinkText,
  getMessage,
  history,
  location,
}: PublicProps) => {
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

export default SlowPageAlertBase;
