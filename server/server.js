const { instrument } = require('@socket.io/admin-ui');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const stateManager = require('./stateManager');
const userHandlers = require('./handlers/userHandlers');
const messageHandlers = require('./handlers/messageHandlers');
const typingHandlers = require('./handlers/typingHandlers');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ['http://localhost:3000', 'https://admin.socket.io'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

stateManager.setIoInstance(io);

const PORT = process.env.PORT || 3001;

app.use(cors());

app.get('/', (req, res) => {
  res.send('Socket.IO Server is running');
});

io.on('connection', socket => {
  console.log(`User connected: ${socket.id}`);

  socket.on('join', data => userHandlers.handleJoin(io, socket, data));
  socket.on('leave', data => userHandlers.handleLeave(socket, data));

  socket.on('startTyping', data =>
    typingHandlers.handleStartTyping(io, socket, data),
  );
  socket.on('stopTyping', data =>
    typingHandlers.handleStopTypingEvent(io, socket, data),
  );

  socket.on('sendMessage', data =>
    messageHandlers.handleSendMessage(io, socket, data),
  );

  socket.on('disconnect', () => userHandlers.handleDisconnect(socket));
});

server.listen(PORT, () => {
  console.log(`Server listening on *:${PORT}`);
});

instrument(io, { auth: false });
