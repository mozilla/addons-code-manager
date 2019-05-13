import * as React from 'react';
import makeClassName from 'classnames';
import { Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { gettext } from '../../utils';
import styles from './styles.module.scss';

type Props = {
  className?: string;
  label?: string;
  onClick: () => void;
  toggleLeft?: boolean;
};

const ToggleButton = ({
  className,
  label,
  onClick,
  toggleLeft = false,
}: Props) => {
  const labelElement = label ? (
    <span className={styles.label}>{label}</span>
  ) : null;
  const icon = toggleLeft ? 'angle-double-left' : 'angle-double-right';

  return (
    <Button
      className={makeClassName(
        styles.ToggleButton,
        {
          [styles.toggleLeft]: toggleLeft,
        },
        className,
      )}
      onClick={onClick}
      title={gettext('Toggle this panel')}
    >
      {!toggleLeft && labelElement}
      <FontAwesomeIcon icon={icon} />
      {toggleLeft && labelElement}
    </Button>
  );
};

export default ToggleButton;
