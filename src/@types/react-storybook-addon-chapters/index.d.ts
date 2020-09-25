declare module 'react-storybook-addon-chapters' {
  function setDefaults(options: Record<string, unknown>): void;
}

// This is used to expose the `addWithChapters` method.
declare module '@storybook/addons' {
  interface ClientStoryApi<StoryFnReturnType = unknown> {
    storiesOf(
      kind: string,
      module: NodeModule,
    ): StoryApi<StoryFnReturnType> & {
      addWithChapters(title: string, config: Record<string, unknown>): this;
    };
  }
}
