/* eslint max-classes-per-file: 0 */
import React, { Component } from 'react';
import { shallow } from 'enzyme';
import { compose } from 'redux';

import { nextUniqueId, shallowUntilTarget } from './test-helpers';

describe(__filename, () => {
  describe('shallowUntilTarget', () => {
    const ExampleBase = () => {
      return <div>Example component</div>;
    };

    const wrapper = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (WrappedComponent: any) => {
        return (props: Record<string, unknown>) => {
          // eslint-disable-next-line react/jsx-props-no-spreading
          return <WrappedComponent {...props} />;
        };
      };
    };

    it('lets you unwrap a component one level', () => {
      const Example = compose(wrapper())(ExampleBase);

      const root = shallowUntilTarget(<Example />, ExampleBase);
      expect(root.text()).toEqual('Example component');
    });

    it('lets you unwrap a component two levels', () => {
      const Example = compose(wrapper(), wrapper())(ExampleBase);

      const root = shallowUntilTarget(<Example />, ExampleBase);
      expect(root.text()).toEqual('Example component');
    });

    it('lets you unwrap a React class based component', () => {
      class ReactExampleBase extends Component {
        render() {
          return <div>example of class based component</div>;
        }
      }

      const Example = compose(wrapper())(ReactExampleBase);

      const root = shallowUntilTarget(<Example />, ReactExampleBase);
      expect(root.instance()).toBeInstanceOf(ReactExampleBase);
    });

    it('does not let you unwrap a component that is not wrapped', () => {
      expect(() => {
        shallowUntilTarget(<ExampleBase />, ExampleBase);
      }).toThrow(/Cannot unwrap this component because it is not wrapped/);
    });

    it('gives up trying to unwrap component after maxTries', () => {
      const Example = compose(wrapper(), wrapper(), wrapper())(ExampleBase);

      expect(() => {
        shallowUntilTarget(<Example />, ExampleBase, { maxTries: 2 });
      }).toThrow(/Could not find .*gave up after 2 tries/s);
    });

    it('lets you pass options to shallow()', () => {
      const shallowStub = jest.fn(shallow);

      const Example = compose(wrapper())(ExampleBase);

      const shallowOptions = {
        disableLifecycleMethods: true,
      };
      const instance = <Example />;
      shallowUntilTarget(instance, ExampleBase, {
        shallowOptions,
        _shallow: shallowStub,
      });

      expect(shallowStub).toHaveBeenCalledWith(instance, shallowOptions);
    });

    it('lets you pass options to the final shallow()', () => {
      const componentDidUpdate = jest.fn();

      // eslint-disable-next-line react/no-multi-comp
      class LifecyleExample extends Component {
        componentDidUpdate() {
          componentDidUpdate();
        }

        render() {
          return <div>example of using lifecycle methods</div>;
        }
      }

      const Example = compose(wrapper())(LifecyleExample);

      // Check assertion to show that lifecycle methods are enabled by default
      let root = shallowUntilTarget(<Example />, LifecyleExample);
      root.setProps({ something: 'else' });

      expect(componentDidUpdate).toHaveBeenCalled();

      componentDidUpdate.mockClear();

      root = shallowUntilTarget(<Example />, LifecyleExample, {
        shallowOptions: { disableLifecycleMethods: true },
      });
      root.setProps({ something: 'else' });

      expect(componentDidUpdate).not.toHaveBeenCalled();
    });
  });

  describe('nextUniqueId', () => {
    it('returns a unique ID', () => {
      expect(nextUniqueId()).not.toEqual(nextUniqueId());
    });
  });
});
