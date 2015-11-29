import {createStore,  applyMiddleware} from 'redux';
import reducers from '../reducers'
import thunk from 'redux-thunk';
import createLogger from 'redux-logger';
import {mapValues} from 'lodash';
import {Iterable} from 'immutable';

export default function configureStore() {
  const logger = createLogger();
  const createStoreWithMiddleware = applyMiddleware(
    thunk,
    logger
  )(proxyStore);
  return createStoreWithMiddleware(reducers);
}

function proxyStore(reducer, initialState) {
  const store = createStore(reducer, initialState);
  return {
    ...store,
    getState: () => {
      const state = store.getState();
      return mapValues(state, (value) =>
        Iterable.isIterable(value) ? value.toJS() : value);
    }
  };
}
