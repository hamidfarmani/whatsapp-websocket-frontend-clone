const {
  users,
  usernameToSocketId,
  handleStopTyping,
} = require('../stateManager');

const handleStartTyping = (io, socket, { group, recipientUsername }) => {
  const userInfo = users[socket.id];
  if (!userInfo) return;

  if (group) {
    if (userInfo.groups.has(group) && userInfo.isTypingIn !== group) {
      if (userInfo.isTypingIn) {
        handleStopTyping(socket.id, userInfo.isTypingIn);
      }
      userInfo.isTypingIn = group;
      socket.broadcast
        .to(group)
        .emit('userTyping', { username: userInfo.username, group });
      console.log(`${userInfo.username} started typing in group ${group}`);
    }
  } else if (recipientUsername) {
    const targetSocketId = usernameToSocketId[recipientUsername];
    if (targetSocketId) {
      io.to(targetSocketId).emit('userTyping', {
        username: userInfo.username,
        isPrivate: true,
      });
      console.log(
        `${userInfo.username} started typing to ${recipientUsername}`,
      );
    }
  }
};

const handleStopTypingEvent = (io, socket, { group, recipientUsername }) => {
  const userInfo = users[socket.id];
  if (!userInfo) return;

  if (group && userInfo.isTypingIn === group) {
    handleStopTyping(socket.id, group);
  } else if (recipientUsername) {
    const targetSocketId = usernameToSocketId[recipientUsername];
    if (targetSocketId) {
      io.to(targetSocketId).emit('userStoppedTyping', {
        username: userInfo.username,
        isPrivate: true,
      });
      console.log(
        `${userInfo.username} stopped typing to ${recipientUsername}`,
      );
    }
  }
};

module.exports = {
  handleStartTyping,
  handleStopTypingEvent,
};
