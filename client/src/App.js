import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import './App.css'; // Import your CSS file
const { MyWallet }  = require('./Transaction.js');
const socket = io('http://localhost:4000');

function App() {
  const [money, setMoney] = useState('');
  const [publicKey, setPublicKey] = useState('');

  const [errorMessage, setErrorMessage] = useState('');
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    socket.on('message', (data) => {
      setMessages((prevMessages) => [...prevMessages, data]);
    });
  }, []);

  const handleMoneyChange = (e) => {
    setMoney(e.target.value);
  };

  const handlePublicKeyChange = (e) => {
    setPublicKey(e.target.value);
  };


  const sendMessage = () => {
    if (!money || !publicKey ) {
      setErrorMessage('Please fill in all fields.');
      setMoney('');
      setPublicKey('');
   return;
    }
    const message = {
      money: parseInt(money),
      publicKey: publicKey,
    };

 

    const wallet=MyWallet(money,publicKey)

    setErrorMessage('');
    setMoney('');
    setPublicKey('');
  };

  return (
    <div className="container">
      <h1>Socket.io Demo</h1>
      <form>
        <div className="form-group">
          <label>Money:</label>
          <input type="number" value={money} onChange={handleMoneyChange} />
        </div>
        <div className="form-group">
          <label>Receiver Public Key:</label>
          <input type="number" value={publicKey} onChange={handlePublicKeyChange} />
        </div>
        <button type="button" onClick={sendMessage}>
          Send Money
        </button>
        {errorMessage && <div className="error-message">{errorMessage}</div>}
      </form>
      <div className="messages-container">
        <h2>All Messages</h2>
        <ul>
          {messages.map((msg, index) => (
            <li key={index}>
              Money: {msg.money}, Receiver Public Key: {msg.publicKey}, Previous Transaction Hash: {msg.prevTxnHash}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default App;
