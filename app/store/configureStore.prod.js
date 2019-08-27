// @flow
//
// Copyright (C) 2019 ExtraHash
//
// Please see the included LICENSE file for more information.
import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import { createHashHistory } from 'history';
import { routerMiddleware } from 'connected-react-router';
import createRootReducer from '../reducers';
import type { counterStateType } from '../reducers/types';

const history = createHashHistory();
// $FlowFixMe
const rootReducer = createRootReducer(history);
const router = routerMiddleware(history);
const enhancer = applyMiddleware(thunk, router);

function configureStore(initialState?: counterStateType) {
  // $FlowFixMe
  return createStore<*, counterStateType, *>(
    rootReducer,
    initialState,
    enhancer
  );
}

export default { configureStore, history };
