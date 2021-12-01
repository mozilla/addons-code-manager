import React from 'react';
import { Meta } from '@storybook/react';

import ToggleButton from '.';

const renderToggleButton = (props = {}) => {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  return <ToggleButton onClick={() => {}} {...props} />;
};

export default {
  title: 'Components/ToggleButton',
  component: ToggleButton,
} as Meta;

export const DefaultButton = () => renderToggleButton();
export const WithALabel = () => renderToggleButton({ label: 'toggle me' });
export const ToggleLeft = () => renderToggleButton({ toggleLeft: true });
export const ToggleLeftAndLabel = () =>
  renderToggleButton({ toggleLeft: true, label: 'toggle me' });
