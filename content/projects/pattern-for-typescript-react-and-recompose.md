---
title: "Pattern for TypeScript, React, and Recompose"
date: 2018-09-22T14:52:52.376-04:00
menu: "projects"
slug: "pattern-for-typescript-react-and-recompose"
authors: ["jaredjohnson"]
---

##### There's no such thing as a silver bullet

If you know [React](https://reactjs.org/), it is probably _one_ of your favorite library for building user interfaces. I used it to build [StringSync](https://stringsync.com) and have been happy with the development experience so far. However, there are a few pain points that I've encountered.

React is typically taught using [class expressions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes). I've found that this programming paradigm does not scale in terms of complexity. By leveraging [stateless functional React components](https://reactjs.org/docs/components-and-props.html#functional-and-class-components) and the [Recompose](https://github.com/acdlite/recompose) library, we're able to transform the development experience in a way that is easier to understand and maintain.

Take the classic click counter component example. Let's say we want to create a component that displays the number of times the click counter button was clicked.

##### Class component example

```jsx
import React from 'react';

class ClickCounter extends React.Component {
  constructor(props) {
    super(props);

    this.state = { clickCount: 0 };

    this.increment = this.increment.bind(this);
  }

  increment() {
    this.setState({ clickCount: this.state.clickCount + 1 })
  }

  render() {
    return (
      <div>
        <div>{this.state.clickCount}</div>
        <button onClick={this.increment}>click</button>
      </div>
    )
  }
}
```

This feels error prone. We have to remember to bind the `thisArg` in the constructor for the handler, call `setState` to update state, etc. -- the list goes on. Let's compare it with a recomposed functional component.

##### Functional component example

```jsx
import React from 'react';
import { compose, withStateHandlers } from 'recompose';

const enhance = compose(
  withStateHandlers(
    { clickCount: 0 },
    {
      increment: state => () => ({
        clickCount: state.clickCount + 1
      }) 
    }
  )
);

const ClickCounter = enhance(props => (
  <div>
    <div>{props.clickCount}</div>
    <button onClick={props.increment}>click</button>
  </div>  
));
```

This is a cleaner approach that has less caveats.

##### It's easy to become complex

When chaining multiple higher order components via Recompose's `compose` function, it's relatively easy to lose track of what's accessible in `props`. Let's take maintainability one step further.

TypeScript is an open-source language by Microsoft that adds optional static typing to JavaScript. For medium to large projects, the overhead of maintaining the type system is paid back whenever code is refactored or a developer joins the team.

I use `@types/recompose` from the [`DefinitelyTyped`](https://github.com/DefinitelyTyped/DefinitelyTyped) project. Let's see how that fits in.

##### The thought process

When creating components this way, start by fleshing out the `enhance` function, which is always the return value of [`compose`](https://github.com/acdlite/recompose/blob/master/docs/API.md#compose).

```ts
const enhance = compose();
```

Behold! The glorius starting point.

Next, think about what props you want to consume in the functional component. For this example, we want a prop called `clickCount` to display the number of clicks, and a handler to `increment` the counter.

We go through [Recompose's API documentation](https://github.com/acdlite/recompose/blob/master/docs/API.md) and find that the higher order component that can satisfy the requirements is called `withStateHandlers`.

This is where it gets tricky. We need to define the type arguments for `withStateHandlers`. We browse through the `@types/recompose` library and find the following snippet:

```ts
export function withStateHandlers<TState, TUpdaters extends StateHandlerMap<TState>, TOutter = {}>(
  createProps: TState | mapper<TOutter, TState>,
  stateUpdaters: StateUpdaters<TOutter, TState, TUpdaters>,
): InferableComponentEnhancerWithProps<TOutter & TState & TUpdaters, TOutter>;
```

We define and use each type argument `TState`, `TUpdaters`, `TOuter` and added props `InnerProps`:

```tsx
// TState
interface ICounterState {
  clickCount: number;
}

// TUpdaters
type CounterStateHandlerProps = StateHandlerMap<ICounterState> & {
  increment(): StateHandler<ICounterState>;
}

// TOuter is an empty object {}

type InnerProps = ICounterState & CounterStateHandlerProps;

const enhance = compose<InnerProps, {}>(
  withStateHandlers<ICounterState, CounterStateHandlerProps, {}>()
)
```

Once you get here, using the library is somewhat trivial:

**All together**

```tsx
import * as React from 'react';
import { compose, withStateHandlers, StateHandlerMap, StateHandler } from 'recompose'

interface ICounterState {
  clickCount: number;
}

type CounterStateHandlerProps = StateHandlerMap<ICounterState> & {
  increment(): StateHandler<ICounterState>;
}

type InnerProps = ICounterState & CounterStateHandlerProps;

const enhance = compose<InnerProps, {}>(
  withStateHandlers<ICounterState, CounterStateHandlerProps, {}>(
    { clickCount: 0 },
    {
      increment: state => () => ({
        clickCount: state.clickCount + 1
      })
    }
  )
)

const ClickCounter = enhance(props => (
  <div>
    <div>{props.clickCount}</div>
    <button onClick={props.increment}>click</button>
  </div>
));
```

*If you find yourself having overly complicated types, consider breaking down your component into smaller ones.*

##### Why would I do this?

They say picture is worth 1000 words. This gif is worth about 158,000 words.

![typescript-react-recompose-example](/images/typescript-react-recompose-example.gif)

Hooray for statically typed props! 🍾🎉🎊