import configureApplication from '../../src/configureApplication';

// Include application styles.
import '../../src/styles.scss';
// Apply some custom styles to storybook.
import './styles.scss';

configureApplication();

export const parameters = {
  actions: { argTypesRegex: '^on[A-Z].*' },
};
