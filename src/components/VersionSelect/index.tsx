import * as React from 'react';
import { Col, Form } from 'react-bootstrap';

import { gettext } from '../../utils';

export type Version = {
  channel: string;
  id: number;
  version: string;
};

type PublicProps = {
  label: string;
  listedVersions: Version[];
  unlistedVersions: Version[];
};

class VersionSelectBase extends React.Component<PublicProps> {
  render() {
    const { label, listedVersions, unlistedVersions } = this.props;

    return (
      <Form.Group as={Col}>
        <Form.Label>{label}</Form.Label>
        <Form.Control as="select">
          {listedVersions.length && (
            <optgroup label={gettext('Listed')}>
              {listedVersions.map((version) => (
                <option key={version.id} value={version.id}>
                  {version.version}
                </option>
              ))}
            </optgroup>
          )}
          {unlistedVersions.length && (
            <optgroup label={gettext('Unlisted')}>
              {unlistedVersions.map((version) => (
                <option key={version.id} value={version.id}>
                  {version.version}
                </option>
              ))}
            </optgroup>
          )}
        </Form.Control>
      </Form.Group>
    );
  }
}

export default VersionSelectBase;
