import { Location } from 'history';
import * as React from 'react';
import { Alert } from 'react-bootstrap';

import {
  allowSlowPagesParam,
  createAdjustedQueryString,
  shouldAllowSlowPages,
} from '../../utils';

type GetTextForSlowState = (allowSlowPages: boolean) => string;

export type PublicProps = {
  _shouldAllowSlowPages?: typeof shouldAllowSlowPages;
  allowSlowPagesByDefault?: boolean;
  getLinkText: GetTextForSlowState;
  getMessage: GetTextForSlowState;
  location: Location;
};

const SlowPageAlertBase = ({
  _shouldAllowSlowPages = shouldAllowSlowPages,
  allowSlowPagesByDefault,
  getLinkText,
  getMessage,
  location,
}: PublicProps) => {
  const allowSlowPages = _shouldAllowSlowPages({
    allowByDefault: allowSlowPagesByDefault,
    location,
  });

  const newLocation = `${location.pathname}${createAdjustedQueryString(
    location,
    {
      [allowSlowPagesParam]: !allowSlowPages,
    },
  )}`;

  return (
    <Alert variant="danger">
      {getMessage(allowSlowPages)}{' '}
      <Alert.Link href={newLocation}>{getLinkText(allowSlowPages)}</Alert.Link>
    </Alert>
  );
};

export default SlowPageAlertBase;
