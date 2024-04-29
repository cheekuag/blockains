import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import './App.css'; // Import your CSS file
const { MyWallet, MyTransactionlist, makeBlock, validateblock, Block, Transaction } = require('./Transaction.js');
const { OverallDifficulty, tranactionPerBlock } = require('./constants.js');
const socket = io('http://localhost:4000');
// import { Block } from './Block.js'; // Adjust the path as per your actual file structure
function App() {
  const [money, setMoney] = useState('');
  const [publicKey, setPublicKey] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [validation, setvalidation] = useState(true);
  // const [Block,setBlock]=useState();

  // useEffect( () => {
   
  // }, socket.on('recieveBlock', block => {
  //   console.log("recievedBlock", block);
  //   if (validation) {
  //     setvalidation(false);
  //     const bool =  validateblock(block);
  //     console.log(bool)
  //     setvalidation(true)
  //   }
  // }),[])

  // socket.on('recieveBlock', block => {
  //   console.log("recievedBlock", block);
  //   if (validation) {
  //     console.log("validation",validation)
  //     setvalidation(false);
  //     const bool = validateblock(block);
  //     console.log(bool)
  //     setvalidation(true)
  //   }
  // });
  useEffect(() => {
    socket.on('recieveBlock', blockData => {
      console.log("recieveBlock");
      console.log(blockData);
      const receivedBlock = new Block(
        blockData.prevHash,
        blockData.transactionlist,
        true, // Assuming flag should be set to true
        blockData.difficulty,
        blockData.ts
      );
      
      console.log("recievedBlock", receivedBlock);
      if (validation) {
        console.log("validation",validation)
        setvalidation(false);
        const bool = validateblock(receivedBlock);
        console.log(bool)
        setvalidation(true)
      }
    });
    socket.on('recieveTransaction', transactionData => {
      console.log("recieveTransaction");
      // Cast the received transaction data into a Transaction instance
      const receivedTransaction = new Transaction(
        transactionData.Inputs,
        transactionData.Outputs
      );
    
      // Push the received transaction to MyTransactionlist
      MyTransactionlist.push(receivedTransaction);
    
      // Check if MyTransactionlist length is greater than or equal to tranactionPerBlock
      if (MyTransactionlist.length >= tranactionPerBlock) {
        // Create a new block
        var block = makeBlock();
        console.log("Block sent", block);
        // Emit the block to the server
        socket.emit('sendBlock', block);;
      }
    });
    // Clean up function to remove the event listener when component unmounts
    return () => {
      socket.off('recieveBlock');
      socket.off('recieveTransaction');
    };
  }, []); 

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

    console.log("sendingTransaction");
    // try {
      var txn = MyWallet.sendMoney(publicKey, parseInt(money));
      // var txn = 1;
      // Emit the transaction to the server
      console.log("Txn sent", txn);
      socket.emit('sendTransaction', txn);
      console.log("sentTransaction");
    // } catch (error) {
    //   console.error('Error sending money:', error.message);
    //   setErrorMessage('Error sending money. Please try again.');
    // }

    // socket.on('recieveTransaction', transaction => {
    //   console.log("recieveTransaction");
    //   console.log("txn received", transaction);
    //   MyTransactionlist.push(transaction);
    //   if (MyTransactionlist.length >= tranactionPerBlock) {
    //     var block = makeBlock();
    //     console.log("Block sent", block);
    //     socket.emit('sendBlock', block);
    //   }
    // });

    
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