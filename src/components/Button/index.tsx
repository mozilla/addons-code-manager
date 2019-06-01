import * as React from 'react';
import makeClassName from 'classnames';
import BsButton from 'react-bootstrap/Button';

import { AnyReactNode } from '../../typeUtils';
import styles from './styles.module.scss';

type Props = {
  className?: string;
  children?: AnyReactNode;
  onClick: () => void;
  title?: string;
  'aria-controls'?: string;
};

const Button = ({
  className,
  children,
  onClick,
  title,
  'aria-controls': ariaControls,
}: Props) => (
  <BsButton
    className={makeClassName(styles.button, className)}
    onClick={onClick}
    title={title}
    aria-controls={ariaControls}
  >
    {children}
  </BsButton>
);

export default Button;
