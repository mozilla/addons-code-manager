import * as React from 'react';
import { Col, Form } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { gettext } from '../../utils';
import styles from './styles.module.scss';

export type Version = {
  channel: string;
  id: number;
  version: string;
};

type PublicProps = {
  label: string;
  listedVersions: Version[];
  unlistedVersions: Version[];
  withLeftArrow: boolean;
};

class VersionSelectBase extends React.Component<PublicProps> {
  static defaultProps = {
    withLeftArrow: false,
  };

  render() {
    const {
      label,
      listedVersions,
      unlistedVersions,
      withLeftArrow,
    } = this.props;

    return (
      <React.Fragment>
        {withLeftArrow && (
          <div className={styles.arrow}>
            <FontAwesomeIcon icon="long-arrow-alt-left" />
          </div>
        )}

        <Form.Group as={Col}>
          <Form.Label>{label}</Form.Label>
          <Form.Control as="select">
            {listedVersions.length && (
              <optgroup
                className={styles.listedGroup}
                label={gettext('Listed')}
              >
                {listedVersions.map((version) => (
                  <option key={version.id} value={version.id}>
                    {version.version}
                  </option>
                ))}
              </optgroup>
            )}
            {unlistedVersions.length && (
              <optgroup
                className={styles.unlistedGroup}
                label={gettext('Unlisted')}
              >
                {unlistedVersions.map((version) => (
                  <option key={version.id} value={version.id}>
                    {version.version}
                  </option>
                ))}
              </optgroup>
            )}
          </Form.Control>
        </Form.Group>
      </React.Fragment>
    );
  }
}

export default VersionSelectBase;
