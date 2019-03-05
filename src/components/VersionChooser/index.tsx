import * as React from 'react';
import { Col, Form, Row } from 'react-bootstrap';

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
              <h3>{gettext('Compare changes')}</h3>
            </Col>
          </Row>

          <Form.Row>
            <VersionSelect
              label={gettext('Choose an old version')}
              listedVersions={listedVersions}
              unlistedVersions={unlistedVersions}
            />

            <VersionSelect
              label={gettext('Choose a new version')}
              listedVersions={listedVersions}
              unlistedVersions={unlistedVersions}
              withLeftArrow
            />
          </Form.Row>
        </Form>
      </div>
    );
  }
}

export default VersionChooserBase;
