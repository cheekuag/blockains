const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);

const io = socketIo(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

const PORT = 4000;

io.on('connection', (socket) => {
  console.log('A user connected');
  socket.on('sendTransaction', (transaction) => {
    io.emit('recieveTransaction', transaction); // Broadcast the message to all connected clients
  });

  socket.on('sendBlock',block=>{
    console.log("Block received",block);
    io.emit('recieveBlock',block);
  })
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 