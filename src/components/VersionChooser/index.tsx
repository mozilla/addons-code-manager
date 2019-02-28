import * as React from 'react';
import { Col, Form, Row } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import VersionSelect, { Version } from '../VersionSelect';
import { gettext } from '../../utils';
import styles from './styles.module.scss';

type PublicProps = {
  versions: Version[];
};

class VersionChooserBase extends React.Component<PublicProps> {
  render() {
    const { versions } = this.props;

    const listedVersions = versions.filter(
      (version) => version.channel === 'listed',
    );
    const unlistedVersions = versions.filter(
      (version) => version.channel === 'unlisted',
    );

    return (
      <div className={styles.VersionChooser}>
        <Form>
          <Row className={styles.heading}>
            <Col>
              <h3>{gettext('Compare changes between two versions')}</h3>
            </Col>
          </Row>

          <Form.Row>
            <VersionSelect
              label={gettext('Choose a base version')}
              listedVersions={listedVersions}
              unlistedVersions={unlistedVersions}
            />

            <div className={styles.arrow}>
              <FontAwesomeIcon icon="long-arrow-alt-left" />
            </div>

            <VersionSelect
              label={gettext('Choose a head version')}
              listedVersions={listedVersions}
              unlistedVersions={unlistedVersions}
            />
          </Form.Row>
        </Form>
      </div>
    );
  }
}

export default VersionChooserBase;
