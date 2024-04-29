import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import './App.css'; // Import your CSS file
const { MyWallet, MyTransactionlist, makeBlock, validateblock } = require('./Transaction.js');
const { OverallDifficulty, tranactionPerBlock } = require('./constants.js');
const socket = io('http://localhost:4000');

function App() {
  const [money, setMoney] = useState('');
  const [publicKey, setPublicKey] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [validation, setvalidation] = useState();
  const [Block,setBlock]=useState();

  useEffect( () => {
   
  }, socket.on('recieveBlock', block => {
    console.log("recievedBlock", block);
    if (validation) {
      setvalidation(false);
      const bool =  validateblock(block);
      console.log(bool)
      setvalidation(true)
    }
  }),[])

  const handleMoneyChange = (e) => {
    setMoney(e.target.value);
  };

  const handlePublicKeyChange = (e) => {
    setPublicKey(e.target.value);
  };


  const sendMessage = () => {
    if (!money || !publicKey) {
      setErrorMessage('Please fill in all fields.');
      setMoney('');
      setPublicKey('');
      return;
    }
    const message = {
      money: parseInt(money),
      publicKey: publicKey,
    };


    try {
      var txn = MyWallet.sendMoney(publicKey, money);
      // Emit the transaction to the server
      console.log("Txn sent", txn);
      socket.emit('sendTransaction', txn);
      console.log("sentTransaction");
    } catch (error) {
      console.error('Error sending money:', error.message);
      setErrorMessage('Error sending money. Please try again.');
    }

    socket.on('recieveTransaction', transaction => {
      console.log("recieveTransaction");
      console.log("txn received", transaction);
      MyTransactionlist.push(transaction);
      if (MyTransactionlist.length >= tranactionPerBlock) {
        var block = makeBlock();
        console.log("Block sent", block);
        socket.emit('sendBlock', block);
      }
    });

    setErrorMessage('');
    setMoney('');
    setPublicKey('');
  };
  // socket.on('recieveTransaction', txn => {
  //   console.log("recieveTransaction");
  //   console.log("txn received", txn);
  //   MyTransactionlist.push(txn);
  //   if (MyTransactionlist.length >= tranactionPerBlock) {
  //     var block = makeBlock();
  //   }

  //   socket.emit('sendBlock', block);
  // });

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