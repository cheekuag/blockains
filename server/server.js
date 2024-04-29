const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const forge = require('node-forge');

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
} = require("../client/src/Transaction.js");
const { createPrivateKey } = require('crypto');
// Define constants
const PORT = 4000;
var index=0;
const transactionPerBlock = 1; // Set number of transactions per block to 1
const Overalldifficulty = 4; // Assuming this is defined elsewhere

// Initialize Express app and create server
const app = express();
const server = http.createServer(app);

// Initialize Socket.io
const io = socketIo(server, {
  cors: {
    // origin: 'http://localhost:3000',
    origin: '*', 
    methods: ['GET', 'POST']
  }
});

// Generate Key Pairs
const keyPairs = [],keyspublic = [];
for (let i = 0; i < 4; i++) {
  const keys = forge.pki.rsa.generateKeyPair({ bits: 2048 });
  keyPairs.push({
    // privateKey: forge.pki.privateKeyToPem(keys.privateKey),
    // publicKey: forge.pki.publicKeyToPem(keys.publicKey)
    privateKey : keys.privateKey,
    publicKey: keys.publicKey
  });
  keyspublic.push(forge.pki.publicKeyToPem(keys.publicKey));
}

// Create OutputList with four output entries for each transaction
const outputList = new OutputList();
for (const keyPair of keyPairs) {
  const output = new Output(keyPair.publicKey, 100);
  outputList.outputList.push(output);
}

// Create a single Transaction with the output list
const transaction = new Transaction(new InputList(), outputList);

// Create Genesis Block with the single transaction
const prevHash = '0'; // Previous hash for genesis block
const genesisBlock = new Block(prevHash, [transaction], false, Overalldifficulty, Date.now());

// Socket.io logic
io.on('connection', (socket) => {
  console.log('A user connected');

  // Send public-private key pairs to the client
  
  var keyPair = keyPairs[index];
  index=index+1;
  console.log("Key Pair",keyPair);
  socket.emit('keyPair', keyPair);

  // Send the genesis block to the client
  socket.emit('recieveBlock', genesisBlock);
socket.emit('keys',keyspublic);

  // Event listeners for transactions or blocks if needed
  socket.on('sendTransaction', (transaction) => {
    io.emit('recieveTransaction', transaction); // Broadcast the message to all connected clients
  });

  socket.on('sendBlock', (block) => {
    console.log("Block received", block);
    io.emit('recieveBlock', block);
  });
});

// Start the server
server.listen(PORT, '192.168.66.62' , () => {
  console.log(`Server running on port ${PORT}`);
});
