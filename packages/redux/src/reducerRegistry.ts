import { Reducer, ReducersMapObject } from 'redux';

export type ReducerRegistryListener = (reducers: ReducersMapObject) => void;

/**
 * See this blog post for some notes on redux modules/code splitting
 * http://nicolasgallagher.com/redux-modules-and-code-splitting/
 */
export class ReducerRegistry {
  reducers = {} as ReducersMapObject;

  listener: ReducerRegistryListener | null = null;

  register(name: string, reducer: Reducer): void {
    this.reducers = { ...this.reducers, [name]: reducer };
    this.listener?.(this.reducers);
  }

  setListener(listener: ReducerRegistryListener): void {
    this.listener = listener;
  }
}

const reducerRegistry = new ReducerRegistry();
export default reducerRegistry;
