const {
  users,
  usernameToSocketId,
  handleStopTyping,
} = require('../stateManager');

const handleSendMessage = (
  io,
  socket,
  { group, recipientUsername, message },
) => {
  const senderInfo = users[socket.id];
  if (!senderInfo) return;

  if (group && senderInfo.isTypingIn === group) {
    handleStopTyping(socket.id, group);
  }

  if (recipientUsername) {
    const targetSocketId = usernameToSocketId[recipientUsername];
    if (targetSocketId) {
      console.log(
        `DM from ${senderInfo.username} to ${recipientUsername}: ${message.text}`,
      );
      io.to(targetSocketId).emit('message', {
        ...message,
        senderUsername: senderInfo.username,
        recipientUsername: recipientUsername,
        isPrivate: true,
        timestamp: new Date().toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      });
      socket.emit('message', {
        ...message,
        senderUsername: senderInfo.username,
        recipientUsername: recipientUsername,
        isPrivate: true,
        user: 'You',
        timestamp: new Date().toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      });
    } else {
      console.log(`DM target ${recipientUsername} not found/offline.`);
      socket.emit('message', {
        type: 'system',
        user: 'System',
        text: `User "${recipientUsername}" is not online.`,
      });
    }
  } else if (group) {
    console.log(
      `Group msg from ${senderInfo.username} to ${group}: ${message.text}`,
    );
    socket.to(group).emit('message', {
      ...message,
      senderUsername: senderInfo.username,
      timestamp: new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    });
  } else {
    console.log('Invalid sendMessage: Missing group or recipientUsername');
    socket.emit('messageError', {
      error: 'Invalid message format: Must specify group or recipient.',
    });
  }
};

module.exports = {
  handleSendMessage,
};
