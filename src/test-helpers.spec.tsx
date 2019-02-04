/* eslint-disable react/no-multi-comp */
import React, { Component } from 'react';
import { shallow } from 'enzyme';
import { compose } from 'redux';

import { shallowUntilTarget } from './test-helpers';

describe(__filename, () => {
  describe('shallowUntilTarget', () => {
    function ExampleBase() {
      return <div>Example component</div>;
    }

    function wrapper() {
      return function Wrapper(WrappedComponent: any) {
        return function InnerWrapper(props: object) {
          return <WrappedComponent {...props} />;
        };
      };
    }

    it('lets you unwrap a component one level', () => {
      const Example = compose(wrapper())(ExampleBase);

      const root = shallowUntilTarget({
        componentInstance: <Example />,
        targetComponent: ExampleBase,
      });
      expect(root.text()).toEqual('Example component');
    });

    it('lets you unwrap a component two levels', () => {
      const Example = compose(
        wrapper(),
        wrapper(),
      )(ExampleBase);

      const root = shallowUntilTarget({
        componentInstance: <Example />,
        targetComponent: ExampleBase,
      });
      expect(root.text()).toEqual('Example component');
    });

    it('lets you unwrap a React class based component', () => {
      class ReactExampleBase extends Component {
        render() {
          return <div>example of class based component</div>;
        }
      }

      const Example = compose(wrapper())(ReactExampleBase);

      const root = shallowUntilTarget({
        componentInstance: <Example />,
        targetComponent: ReactExampleBase,
      });
      expect(root.instance()).toBeInstanceOf(ReactExampleBase);
    });

    it('does not let you unwrap a component that is not wrapped', () => {
      expect(() => {
        shallowUntilTarget({
          componentInstance: <ExampleBase />,
          targetComponent: ExampleBase,
        });
      }).toThrow(/Cannot unwrap this component because it is not wrapped/);
    });

    it('gives up trying to unwrap component after maxTries', () => {
      const Example = compose(
        wrapper(),
        wrapper(),
        wrapper(),
      )(ExampleBase);

      expect(() => {
        shallowUntilTarget({
          componentInstance: <Example />,
          targetComponent: ExampleBase,
          options: {
            maxTries: 2,
          },
        });
      }).toThrow(/Could not find .*gave up after 2 tries/);
    });

    it('lets you pass options to shallow()', () => {
      const shallowStub = jest.fn(shallow);

      const Example = compose(wrapper())(ExampleBase);

      const shallowOptions = {
        lifecycleExperimental: true,
      };
      const instance = <Example />;
      shallowUntilTarget({
        componentInstance: instance,
        targetComponent: ExampleBase,
        options: {
          shallowOptions,
          _shallow: shallowStub,
        },
      });

      expect(shallowStub).toHaveBeenCalledWith(instance, shallowOptions);
    });

    it('lets you pass options to the final shallow()', () => {
      const componentDidUpdate = jest.fn();

      class LifecyleExample extends Component {
        componentDidUpdate() {
          componentDidUpdate();
        }

        render() {
          return <div>example of using lifecycle methods</div>;
        }
      }

      const Example = compose(wrapper())(LifecyleExample);

      const root = shallowUntilTarget({
        componentInstance: <Example />,
        targetComponent: LifecyleExample,
        options: {
          shallowOptions: {
            lifecycleExperimental: true,
          },
        },
      });
      root.setProps({ something: 'else' });

      expect(componentDidUpdate).toHaveBeenCalled();
    });
  });
});
