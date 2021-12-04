import './index.css'
import React from 'react';
import ReactDOM from 'react-dom';
import Main from './Main';
import reportWebVitals from './reportWebVitals';
import {store} from './state/index'
import {Provider} from 'react-redux'
import {
  BrowserRouter as Router,
  Switch,
  Route,
} from "react-router-dom";

ReactDOM.render(
  <React.StrictMode>
  <Provider store={store}>
  <Router><Switch>


  <Route path='/'>
  <Main />
  </Route>

  </Switch></Router>
  </Provider>
  </React.StrictMode>,

  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
