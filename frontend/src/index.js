import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { PayPalScriptProvider } from '@paypal/react-paypal-js';

import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';
import App from './App';
import { store, persistor } from './store/store';
import reportWebVitals from './reportWebVitals';

// Stripe public key from environment variable
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY);

// PayPal initialization options
const paypalOptions = {
  "client-id": process.env.REACT_APP_PAYPAL_CLIENT_ID || "sb", // Use sandbox client-id if not provided
  currency: "USD",
  intent: "capture"
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <BrowserRouter>
          <Elements stripe={stripePromise}>
            <PayPalScriptProvider options={paypalOptions}>
              <App />
            </PayPalScriptProvider>
          </Elements>
        </BrowserRouter>
      </PersistGate>
    </Provider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals(); 