// eslint-disable-next-line import/no-extraneous-dependencies
import { Story } from '@storybook/react';

declare module 'react-storybook-addon-chapters' {
  const setDefaults = (options: object): void => {};
}

// This is used to expose the `addWithChapters` method.
declare module '@storybook/addons' {
  interface ClientStoryApi<StoryFnReturnType = unknown> {
    storiesOf(
      kind: string,
      module: NodeModule
    ): StoryApi<StoryFnReturnType> & {
      addWithChapters(title: string, config: object): this;
    };
  }
}
