declare module 'refractor' {
  declare function register(language: Record<string, unknown>): void;

  type RefractorNode = {
    children?: RefractorNode[];
    tagName?: string;
    type: string;
    value: string;
    properties?: {
      className?: string | string[];
      // A node might have arbitrary properties.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      [key: string]: any;
    };
  };

  declare function highlight(value: string, language: string): RefractorNode[];
}
