const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const formatMessage = require('./utils/messages');

const bodyParser = require('body-parser');
const cors = require('cors');


const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers
} = require('./utils/users');
const { log } = require('console');

const app = express();
app.use(bodyParser.json());
app.use(cors());

const server = http.createServer(app);
const io = socketio(server);




app.get('/api/users', (req, res) => {
  console.log(req);
  res.json(req.body);

});

app.post('/api/users', (req, res) => {
  console.log('Received POST request:', req.body);
  const { name } = req.body;
 
  const createdUser = { id: 3, name: name };
  res.status(201).json(req.body);
});


app.post('/api/messages', (req, res) => {
  const { content, sender } = req.body;
  
  // Broadcast the message to all connected clients
  io.emit('chat message', { content, sender });

  res.status(200).json({ success: true, message: 'Message sent successfully.' });
});


app.use(express.static(path.join(__dirname, 'public')));

const botName = 'Chat Bot';


// Run when client connects
io.on('connection', socket => {
  socket.on('joinRoom', ({ username, room }) => {
    const user = userJoin(socket.id, username, room);

    const roomName = room;

    socket.join(user.room);

    // Welcome current user
    socket.emit('message', formatMessage(botName, `Welcome to ${roomName} Room`));

    // Broadcast when a user connects
    socket.broadcast
      .to(user.room)
      .emit(
        'message',
        formatMessage(botName, `${user.username} has joined the chat`)
      );

    // Send users and room info
    io.to(user.room).emit('roomUsers', {
      room: user.room,
      users: getRoomUsers(user.room)
    });
  });

  // Listen for chatMessage
  socket.on('chatMessage', msg => {
    const user = getCurrentUser(socket.id);

    io.to(user.room).emit('message', formatMessage(user.username, msg));
  });

  // Runs when client disconnects
  socket.on('disconnect', () => {
    const user = userLeave(socket.id);

    if (user) {
      io.to(user.room).emit(
        'message',
        formatMessage(botName, `${user.username} has left the chat`)
      );

      // Send users and room info
      io.to(user.room).emit('roomUsers', {
        room: user.room,
        users: getRoomUsers(user.room)
      });
    }
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
