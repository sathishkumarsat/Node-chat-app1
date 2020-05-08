const express = require('express');//Loading the library
const path = require('path');//Core node module, no need of external installation

//To set up websocket.io, change the way of using/configuring express, for that do below 3 steps
const http = require('http');//step1

const socketio = require('socket.io');//Loading websocket to socketio fn
const Filter = require('bad-words');
const { generateMessage, generateLocation } = require('./utils/messages');
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users');

//Creating/Generating express app
const app = express();
const server = http.createServer(app);//step2
const io = socketio(server);//configure socketio fn with server, for that we created server explicitly, so clients can access using io()

//Set up port
const port = process.env.PORT || 3000;

//Public dirctory path set up
const publicDirectoryPath = path.join(__dirname, '../public');//__dirname is current directory of this file & renders the files in public folder

//Configuring server n up n run//

//Express static middleware to serve up publicDirectoryPath
app.use(express.static(publicDirectoryPath));

//io.to.emit - emit a event to everybody in a specific room but not to other rooms
//socket.broadcast.to.emit - emit a event to everybody in a specific room except for client

io.on('connection', (socket) => {
    console.log('New Websocket connection');

    //Listener for new user joining
    //socket.on('join', ({ username, room }, callback) => {
    socket.on('join', (options, callback) => {//we can use options = { username, room }

        //This is where user joins the room, so use addUser() to add user to users array n to keep track of joined user
        //Every single connection has unique id associated with it i.e socket.id
        //Provide id, username, room to addUser fn
        //From addUser() fn we will get back either error or user(if everything right), for that store fn by destructuring
        //const { error, user } = addUser({ id: socket.id, username: username, room: room });
        const { error, user } = addUser({ id: socket.id, ...options });//...options is spread operator

        //If user successfully not joined, send that error back to client(chat.js), provide him with reason/acknowledgement
        //For that add 'callback' as cb fn as final arg like every listener(socket.on()) 
        if (error) {
            return callback(error);//For letting client(chat.js) know the error
            //We use return to stop running remaining code, we can also do that by putting remaining/below code inside 'else' block 
        }

        //socket.join(room); changed to ->
        socket.join(user.room);//Bcz we need to use the o/p from addUser() fn like user.room, user.id,..

        socket.emit('messageUpdated', generateMessage('Admin', 'Welcome!'));

        //socket.broadcast.to(room).emit('messageUpdated', generateMessage(`${username} has joined!`));
        socket.broadcast.to(user.room).emit('messageUpdated', generateMessage('Admin', `${user.username} has joined!`));

        //Emit a new event from server to the client, when room list changes(that happens when someone joins or leaves)
        //io.to() - send something to every user in that room including new user
        //Here we send list of users n room name
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)//Get users in specific room
        });//Do the same when user leaves('disconnect'), then update in chat.js(client side)
        callback();//To let the client(chat.js) know joined successfully without error

    });


    //Now send messages to the correct room in 'sendMessage' event listener
    socket.on('sendMessage', (message, callback) => {//Add another parameted to callback fn

        //get user by their socket id, n get access to user data, by using that data we can emit msg to corret room they are in
        const user = getUser(socket.id);

        //To check for profanity/bad-words
        const filter = new Filter();

        if (filter.isProfane(message)) {//If profane word
            return callback('Profanity is not allowed!');//Stop execution using 'return' n send callback with data
        }
        //we don't have access to room var, so use static room for now, server emit all msgs to this static room only
        //io.to('California').emit('messageUpdated', generateMessage(message));

        //Now we have access to room var
        //io.to(user.room).emit('messageUpdated', generateMessage(message));

        //Now to display username in chatroom, add one more arg in above emitter, 
        //there by add it in messages.js(generateLocation) n chat.js n chat.html(User Name -> {{username}})
        io.to(user.room).emit('messageUpdated', generateMessage(user.username, message));
        callback();
    });


    //Now send Location to the correct room in 'sendLocation' event listener
    socket.on('sendLocation', (locationData, callback) => {

        //get user by their socket id, n get access to user data, by using that data we can emit msg to corret room they are in
        const user = getUser(socket.id);

        //we don't have access to room var, so use static room for now, server emit all msgs to this static room only
        //io.emit('locationMessage', generateLocation(`https://google.com/maps?q=${locationData.latitude},${locationData.longitude}`));

        //Now we have access to room var
        //io.to(user.room).emit('locationMessage', generateLocation(`https://google.com/maps?q=${locationData.latitude},${locationData.longitude}`));

        //Now to display username in chatroom, add one more arg in above emitter, 
        //there by add it in messages.js(generateLocation) n chat.js n chat.html(User Name -> {{username}})
        io.to(user.room).emit('locationMessage', generateLocation(user.username, `https://google.com/maps?q=${locationData.latitude},${locationData.longitude}`));
        callback();
    })


    //Runs when client disconnected
    socket.on('disconnect', () => {
        //Need to erase the user data, so remove user by id, returns user or undefined
        const user = removeUser(socket.id);

        //There is a chance that the user disconnected was never part of the room 
        //or if person try to login with invalid credentials n closed the browser, in both cases no one needs to know the user has left
        if (user) {//if user exists
            //io.emit('messageUpdated', generateMessage('A user has left!'));
            io.to(user.room).emit('messageUpdated', generateMessage('Admin', `${user.username} has left!`));//Send to only same room users
            //get all users in present room
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            });
        }
    });


});




//To listen on port
//app.listen(port); -> one way to do it, callback fn is optional
//app.listen(port, () => {//without http
server.listen(port, () => {//step3
    console.log(`Server is up on port ${port}!`);//used backticks/backquotes
});




