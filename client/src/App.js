import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import "./App.css"; // Import your CSS file
const {
  MyWallet,
  MyTransactionlist,
  makeBlock,
  validateblock,
  Block,
  Transaction,
  InputList,
  OutputList,
  Output,
  getbalance
} = require("./Transaction.js");
const { OverallDifficulty, tranactionPerBlock } = require("./constants.js");
// const socket = io("http://localhost:4000");
const socket = io('http://192.168.66.62:4000');

function App() {
  const [money, setMoney] = useState("");
  const [publicKey, setPublicKey] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [validation, setvalidation] = useState(true);

  useEffect(() => {
  
    socket.on('keyPair', (keyPair) => {
      MyWallet.publicKey = keyPair.publicKey;
      MyWallet.privateKey = keyPair.privateKey;
      console.log("keys-pair", keyPair);
    });

    socket.on("keys", keyspublic => {
      // iterate over keyspublic and print it
      for (let i = 0; i < keyspublic.length; i++) {
        console.log("Public-Key", keyspublic[i]);
      }
    });

    socket.on("recieveBlock", (blockData) => {
      console.log("Socket recieveBlock");
      // console.log(blockData);
      const receivedBlock = new Block(
        blockData.prevHash,
        blockData.transactionlist,
        true, // Assuming flag should be set to true
        blockData.difficulty,
        blockData.ts,
        blockData.nonce
      );

      // console.log("recievedBlock", receivedBlock);
      if (validation) {
        // console.log("validation",validation)
        setvalidation(false);
        const bool = validateblock(receivedBlock);
        if (bool == false) {
          setErrorMessage("Invalid Block");
          return;
        }
        // console.log(bool)
        setvalidation(true);
      }
    });
    socket.on("recieveTransaction", (transactionData) => {
      console.log("Socket recieveTransaction");
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
        if (block == null) {
          setErrorMessage("Insufficient Transactions");
          return;
        }
        console.log("Socket sentBlock");
        // Emit the block to the server
        socket.emit("sendBlock", block);
      }
    });
    // Clean up function to remove the event listener when component unmounts
    return () => {
      socket.off("recieveBlock");
      socket.off("recieveTransaction");
      socket.off("keyPair");
      socket.off("keys");
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
      setErrorMessage("Please fill in all fields.");
      setMoney("");
      setPublicKey("");
      return;
    }

    // console.log("sendingTransaction");
    var txn = MyWallet.sendMoney(publicKey, parseInt(money));
    if (txn == null) {
      setErrorMessage("Insufficient Balance");
      return;
    }
    // Emit the transaction to the server
    console.log("Socket sentTransaction", txn);
    socket.emit("sendTransaction", txn);
    // console.log("sentTransaction");
    setErrorMessage("");
    setMoney("");
    setPublicKey("");
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
          <input
            type="text"
            value={publicKey}
            onChange={handlePublicKeyChange}
          />
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
              Money: {msg.money}, Receiver Public Key: {msg.publicKey}, Previous
              Transaction Hash: {msg.prevTxnHash}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default App;
