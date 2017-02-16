'use strict'
const socketio = require('socket.io');
let io;
let guestNumber = 1;
let nickNames = {};
let nameUsed = [];
let currentRoom = {};

exports.listen = function(server) {
    io = socketio.listen(server); //启动Socket.IO服务器，允许它搭载在已有的HTTP服务器上
    io.set('log level', 1); //将socket.io中的debug信息关闭

    io.sockets.on('connection', function(socket) {
        guestNumber = assignGuestName(socket, guestNumber, nickNames, nameUsed); //在用户连接上来时赋予其一个访客名
        joinRoom(socket, 'Lobbby'); //用户连接上来时把他放入聊天室Lobby里

        handleMessageBroadcasting(socket, nickNames); //用户消息处理
        handleNameChangeAttempts(socket, nickNames); //用户更名处理
        handleRoomJoining(socket); //聊天室创建和变更处理

        socket.on('rooms', function() { //用户发送请求时提供已经被占用的聊天室的列表
            socket.emit('rooms', io.sockets.manager.rooms);
        });

        handleClientDisconnection(socket, nickNames, nameUsed); //断开连接后的清除逻辑

    })
};

function assignGuestName(socket, guestNumber, nickNames, nameUsed) {
    let name = '访客' + guestNumber; //生成新昵称
    nickNames[socket.id] = name; //把用户昵称和客户端连接ID关联上
    socket.emit('nameResult', { success: true, name: name }); //让用户知道他们的昵称
    nameUsed.push(name);
    return guestNumber + 1;
}

function joinRoom(socket, room) {
    socket.join(room);
    currentRoom[socket.id] = room;
    socket.emit('joinResult', { room: room }); //让用户知道他们进入了新的房间
    socket.broadcast.to(room).emit('message', {
        text: nickNames[socket.id] + 'has joined' + room + '.'
    }); //让房间里的其他用户知道有新用户进入了房间

    let usersInRoom = io.sockets.clients(room);
    if (usersInRoom.length > 1) {
        let usersInRoomSummary = 'Users currently in' + room + ':';
        for (var index in usersInRoom) {
            let userSocketId = usersInRoom[index].id;
            if (userSocketId != socket.id) {
                if (index > 0) {
                    usersInRoomSummary += ', ';
                }
                usersInRoomSummary += nickNames[userSocketId];
            }
        }
        usersInRoomSummary += '.';
        socket.emit('message', { text: usersInRoomSummary }); //将用户汇总结果发送给这个用户
    }
}

function handleNameChangeAttempts(socket, nickNames, nameUsed) {
    socket.on('nameAttempt', function(name) {
        if (name, indexOf('Guest') == 0) {
            socket.emit('nameResult', {
                success: false,
                message: 'Names cannot begin with "Guest"'
            })
        } else {
            if (nameUsed.indexOf(name) == -1) {
                let previousName = nickNames[socket.id];
                let previousNameIndex = nameUsed.indexOf(previousName);
                namesUsed.push(name);
                delete nameUsed[previousNameIndex]; //删掉之前用的昵称
                socket.emit('nameResult', {
                    success: true,
                    name: name
                });
                socket.broadcast.to(currentRoom[socket.id]).emit('message', {
                    text: previousName + 'is now known as' + name + '.'
                });
            } else {
                socket.emit('nameResult', {
                    success: false,
                    message: 'That name is already in use.'
                })
            };
        }
    });
}

function handleMessageBroadcasting(socket) {
    socket.on('message', function(message) {
        socket.broadcast.to(message.room).emit('message', {
            text: nickNames[socket.id] + ': ' + message.text
        });
    });
}

function handleRoomJoining(socket) {
    socket.on('join', function(room) {
        socket.leave(currentRoom[socket.id]); //离开当前房间
        joinRoom(socket, room.newRoom); //加入新房间
    });
}

function handleClientDisconnection(socket) {
    socket.on('disconnect', function() {
        let nameIndex = namesUsed.indexOf(nickNames[socket.id]);
        delete nameUsed[nameIndex];
        delete nickNames[socket.id];
    })
}