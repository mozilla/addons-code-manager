import * as React from 'react';
import makeClassName from 'classnames';
import { Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import styles from './styles.module.scss';

type Props = {
  className?: string;
  label?: string | null;
  onClick: () => void;
  title?: string;
  toggleLeft?: boolean;
};

const ToggleButton = ({
  className,
  label,
  onClick,
  title,
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
      title={title}
    >
      {!toggleLeft && labelElement}
      <FontAwesomeIcon icon={icon} />
      {toggleLeft && labelElement}
    </Button>
  );
};

export default ToggleButton;
