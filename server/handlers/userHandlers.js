const {
  users,
  groups,
  usernameToSocketId,
  notifyGroupUserList,
  handleUserLeave,
  cleanupUser,
} = require('../stateManager');

const handleJoin = (io, socket, { username, group }) => {
  if (
    usernameToSocketId[username] &&
    usernameToSocketId[username] !== socket.id
  ) {
    socket.emit('joinError', {
      message: `Username "${username}" is already taken.`,
    });
    console.log(`Username conflict: ${username} attempted by ${socket.id}`);
    return;
  }

  const existingSocketId = usernameToSocketId[username];
  if (existingSocketId && existingSocketId !== socket.id) {
    console.log(
      `Cleaning up old socket ${existingSocketId} for username ${username}`,
    );
    const oldSocket = io.sockets.sockets.get(existingSocketId);
    if (oldSocket) {
      if (users[existingSocketId]) {
        users[existingSocketId].groups = new Set();
      }
      oldSocket.disconnect();
    }
    delete users[existingSocketId];
  }

  users[socket.id] = { username, groups: new Set(), isTypingIn: null };
  usernameToSocketId[username] = socket.id;
  users[socket.id].groups.add(group);

  if (!groups[group]) {
    groups[group] = new Set();
  }
  groups[group].add(username);
  socket.join(group);
  console.log(`${username} (${socket.id}) joined group: ${group}`);

  socket.to(group).emit('message', {
    type: 'system',
    user: 'System',
    text: `${username} has joined the group`,
  });

  notifyGroupUserList(group);
};

const handleLeave = (socket, { username, group }) => {
  console.log(`${username} (${socket.id}) is leaving group: ${group}`);
  handleUserLeave(socket.id, username, group); // Use imported state manager function
  socket.leave(group);
  if (users[socket.id]) {
    users[socket.id].groups.delete(group);
  }
};

const handleDisconnect = socket => {
  console.log(`User disconnected: ${socket.id}`);
  cleanupUser(socket.id);
};

module.exports = {
  handleJoin,
  handleLeave,
  handleDisconnect,
};
