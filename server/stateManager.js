const users = {};
const groups = {};
const usernameToSocketId = {};

let ioInstance;

const setIoInstance = io => {
  ioInstance = io;
};

const getUsersInGroup = group => {
  return groups[group] ? Array.from(groups[group]) : [];
};

const notifyGroupUserList = group => {
  if (groups[group] && ioInstance) {
    ioInstance.to(group).emit('updateUserList', getUsersInGroup(group));
  }
};

const handleStopTyping = (socketId, group) => {
  const userInfo = users[socketId];
  if (userInfo && userInfo.isTypingIn === group) {
    const username = userInfo.username;
    userInfo.isTypingIn = null;
    if (ioInstance) {
      ioInstance
        .to(group)
        .emit('userStoppedTyping', { username: username, group });
    }
    console.log(`${username} stopped typing in ${group}`);
  }
};

const handleUserLeave = (socketId, username, group) => {
  const effectiveUsername = username || users[socketId]?.username;
  if (!effectiveUsername) {
    console.log(
      `Cannot process leave for socket ${socketId}, user info not found.`,
    );
    return;
  }

  handleStopTyping(socketId, group);

  if (groups[group]) {
    groups[group].delete(effectiveUsername);
    console.log(`${effectiveUsername} left group: ${group}`);
    if (ioInstance) {
      ioInstance.to(group).emit('message', {
        type: 'system',
        user: 'System',
        text: `${effectiveUsername} has left the group`,
      });
    }
    notifyGroupUserList(group);
    if (groups[group].size === 0) {
      delete groups[group];
      console.log(`Group ${group} is now empty and removed.`);
    }
  }
};

const cleanupUser = socketId => {
  const userInfo = users[socketId];
  if (userInfo) {
    const { username, groups: userGroups, isTypingIn } = userInfo;

    if (isTypingIn) {
      handleStopTyping(socketId, isTypingIn);
    }

    Array.from(userGroups).forEach(group => {
      handleUserLeave(socketId, username, group);
    });

    delete usernameToSocketId[username];
    delete users[socketId];
    console.log(`Cleaned up disconnected user ${username} (${socketId})`);
  } else {
    console.log(`Disconnected socket ${socketId} had no user info.`);
  }
};

module.exports = {
  users,
  groups,
  usernameToSocketId,
  setIoInstance,
  getUsersInGroup,
  notifyGroupUserList,
  handleStopTyping,
  handleUserLeave,
  cleanupUser,
};
