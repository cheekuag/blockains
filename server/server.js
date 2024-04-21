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
  socket.on('message', (data) => {
    io.emit('recieve_message', data); // Broadcast the message to all connected clients
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
