import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import Signup from './Signup'; 
import './Signup.css';

const root = document.getElementById('root');

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <App>
    <Signup />
    </App>
  </React.StrictMode>
);