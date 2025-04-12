
// Importing required modules 
const express = require('express');
const path = require('path');
const flash = require('connect-flash');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const { Server } = require("socket.io");
const { createServer } = require("http");
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();

// Import database connection
const db = require('./config/mongoose');

// Import flash middleware
const flashmiddleware = require('./config/flash');

// Import models
const ChatModel = require('./models/ChatModel');
const UserModel = require('./models/UserModel');

// Import routes
const adminRoutes = require('./routes/admin');
const apiRoutes = require('./routes/api');
const adminApiRoutes = require('./routes/adminapi');

// Create an instance of an Express application
const app = express();

// Create HTTP server and integrate Socket.io
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
        credentials: true,
    },
});

app.use(
    cors({
        origin: "*",
        methods: ["GET", "POST"],
        credentials: true,
    })
);

// // Make io accessible to routes
// app.set('io', io);

// Configure session
const sessionMiddleware = session({
    secret: process.env.SESSION_SECRET || 'your_session_secret',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.DB_CONNECTION,
        ttl: 30 * 24 * 60 * 60, // 30 days in seconds
    })
});
app.use(sessionMiddleware);

// // Share session with Socket.io
// io.use((socket, next) => {
//     sessionMiddleware(socket.request, {}, next);
// });

// Configure EJS as the templating engine
app.set('view engine', 'ejs');
app.set('views', [
    path.join(__dirname, 'views'),
    path.join(__dirname, 'views/admin'),
    path.join(__dirname, 'views/user'),
    path.join(__dirname, 'views/layouts')
]);

// Configure static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/videofile', express.static(path.join(__dirname, 'videofile')));

// Use flash middleware
app.use(flash());
app.use(flashmiddleware.setflash);

// Configure handling form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Use routes
app.use('/', adminRoutes);
app.use('/api', apiRoutes);
app.use('/admin/api', adminApiRoutes);

// Connect to the '/userchat' namespace
const userChat = io.of('/userchat');

// Connect to the '/adminchat' namespace
const adminChat = io.of('/adminchat');

// Handle connections to '/userchat'
userChat.on('connection', (socket) => {
    console.log(`New client connected to /userchat: ${socket.id}`);

    // Listen for 'sendMessage' events from the client
    socket.on('sendMessage', async (data) => {
        console.log(`Received 'sendMessage' from ${socket.id}:`, data);
        const { userId, message } = data;

        if (!userId || !message) {
            socket.emit('error', { message: 'Invalid data format' });
            return;
        }

        try {
            
            // Save message to database
            const chat = await ChatModel.create({ sender: 'user', userId, message, is_admin: false });

            // Update user's last activity
            await UserModel.findByIdAndUpdate(userId, { lastActivity: Date.now() });

            console.log(`Message from user ${userId} saved successfully.`);

            // Emit the message to all admins in the '/adminchat' namespace
            adminChat.emit('adminReceiveMessage', { message: chat });
            console.log(`Emitted 'adminReceiveMessage' to admins:`, chat);

            // Optionally, emit confirmation back to the user
            socket.emit('messageSent', { message: chat });
            console.log(`Emitted 'messageSent' to user ${userId}:`, chat);

        } catch (error) {
            console.error('Error sending message:', error);
            socket.emit('error', { message: 'Failed to send message' });
        }
    });

    // Handle disconnections
    socket.on('disconnect', () => {
        console.log(`Client disconnected from /userchat: ${socket.id}`);
    });
});

// Handle connections to '/adminchat'
adminChat.on('connection', (socket) => {
    console.log(`New admin connected to /adminchat: ${socket.id}`);

    // Listen for messages from admins (if admins can send messages)
    socket.on('adminSendMessage', async (data) => {

        console.log(`Received 'adminSendMessage' from ${socket.id}:`, data);
        const { userId, message } = data;

        if (!userId || !message) {
            socket.emit('error', { message: 'Invalid data format' });
            return;
        }

        try {
            // Save admin message to database
            const chat = await ChatModel.create({ sender: 'admin', userId, message, is_admin: true });

            userChat.emit('adminMessage', { message: chat });
            console.log(`Emitted 'adminMessage' to user ${userId}:`, chat);

        } catch (error) {
            console.error('Error sending message from admin:', error);
            socket.emit('error', { message: 'Failed to send message' });
        }
    });

    // Handle disconnections
    socket.on('disconnect', () => {
        console.log(`Admin disconnected from /adminchat: ${socket.id}`);
    });
});


// Start the server
const PORT = process.env.SERVER_PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server started on port: ${PORT}`);
});


