declare module 'storybook-addon-root-attribute' {
  import { StoryDecorator } from '@storybook/react';

  declare function withRootAttribute(
    ...params: Parameters<StoryDecorator>
  ): ReturnValue<StoryDecorator>;
}
