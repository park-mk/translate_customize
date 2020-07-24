import React, { useState, useMemo, useCallback, useEffect } from 'react';
import GlobalStyle from './GlobalStyle';
import Header from './Header';
import Main from './Main';
import Footer from './Footer';
import Sub from '../subtitle/sub';
import clamp from 'lodash/clamp';
import { secondToTime, notify } from '../utils';
import { getSubFromVttUrl, vttToUrlUseWorker } from '../subtitle';
import Storage from '../utils/storage';
import isEqual from 'lodash/isEqual';
import NProgress from 'nprogress';
import { ToastContainer } from 'react-toastify';
import translate, { googleTranslate } from '../translate';
import { t, setLocale } from 'react-i18nify';
import ReactDOM from 'react-dom';
import { BrowserRouter  as Router, Switch, Route  } from "react-router-dom"; 
import Home from './Home';
const history = [];
let inTranslation = false;
const storage = new Storage();
const worker = new Worker(vttToUrlUseWorker());

export default function() {
     
  
    return (
        <Router>
     <Switch>
    <Route path={["/:something","/somewhere2/:something"]}  >
       <Home/>
        </Route>
  </Switch>
 </Router>

    );
}
