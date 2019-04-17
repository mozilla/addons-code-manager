import * as React from 'react';
import { Col, Form } from 'react-bootstrap';
// eslint-disable-next-line import/no-unresolved
import { FormControlProps } from 'react-bootstrap/lib/FormControl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { VersionsList, VersionsListItem } from '../../reducers/versions';
import { gettext } from '../../utils';
import styles from './styles.module.scss';

export type PublicProps = {
  className?: string;
  isSelectable: (version: VersionsListItem) => boolean;
  label: string;
  listedVersions: VersionsList;
  onChange: (version: string) => void;
  unlistedVersions: VersionsList;
  value: string | undefined;
  withLeftArrow: boolean;
};

class VersionSelectBase extends React.Component<PublicProps> {
  static defaultProps = {
    withLeftArrow: false,
  };

  onChange = (event: React.FormEvent<FormControlProps>) => {
    const value = event.currentTarget.value as string;

    this.props.onChange(value);
  };

  renderOption = (version: VersionsListItem) => {
    const { isSelectable } = this.props;

    return (
      <option
        className={styles.option}
        disabled={!isSelectable(version)}
        key={version.id}
        value={version.id}
      >
        {version.version}
      </option>
    );
  };

  render() {
    const {
      className,
      label,
      listedVersions,
      unlistedVersions,
      value,
      withLeftArrow,
    } = this.props;

    return (
      <React.Fragment>
        {withLeftArrow && (
          <div className={styles.arrow}>
            <FontAwesomeIcon icon="long-arrow-alt-left" />
          </div>
        )}

        <Form.Group as={Col} className={className}>
          <Form.Label>{label}</Form.Label>
          <Form.Control as="select" value={value} onChange={this.onChange}>
            {listedVersions.length && (
              <optgroup
                className={styles.listedGroup}
                label={gettext('Listed')}
              >
                {listedVersions.map(this.renderOption)}
              </optgroup>
            )}
            {unlistedVersions.length && (
              <optgroup
                className={styles.unlistedGroup}
                label={gettext('Unlisted')}
              >
                {unlistedVersions.map(this.renderOption)}
              </optgroup>
            )}
          </Form.Control>
        </Form.Group>
      </React.Fragment>
    );
  }
}

export default VersionSelectBase;
