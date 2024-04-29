import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import App from './App';
import { CustomContextProvider, useCustomContext } from './context';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <CustomContextProvider>
  <Router>
    <React.StrictMode>
      <Routes>
      <Route path="/" element={<App />} />
      </Routes>
    </React.StrictMode>
  </Router>
  </CustomContextProvider>
);
