const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const formatMessage = require('./utils/messages');
const WebSocket = require('ws');

// Create a WebSocket server
const wss = new WebSocket.Server({ port: 3000 });

// Store connected clients
const clients = new Set();

// Handle connection event
wss.on('connection', (ws) => {
  // Add client to the set
  clients.add(ws);

  // Handle message event
  ws.on('message', (message) => {
    // Broadcast the received message to all connected clients
    clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });

  // Handle close event
  ws.on('close', () => {
    // Remove client from the set
    clients.delete(ws);
  });
});

console.log('WebSocket server started on port 8080');