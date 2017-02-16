'use strict'
const msgNode = $('#messages');

function divEscapedContentElement(message) {
    return $('<div></div>').text(message);
}

function divSystemContentElement(message) {
    return $('<div></div>').html('<i>' + message + '</i>');
}

function processUserInpit(chatApp, socket) {
    let message = $('#send-message').val();
    let systemMessage;

    if (message.charAt(0) == '/') {
        systemMessage = chatApp.processCommand(message);
        if (systemMessage) {
            msgNode.append(divSystemContentElement(systemMessage));
        } else chatApp.sendMessage($('#room').text(), message); //非系统指令广播给其他用户
        msgNode.append(divEscapedContentElement(message));
        msgNode.scrollTop(msgNode.prop('scrollHeight'));
        $('#send-message').val('');
    }
}

const socket = io.connect();

$(function() {
    let chatApp = new Chat(socket);
    let inputFocus = () => { $('#send-message').focus() };

    socket.on('nameResult', function(result) { //显示更名尝试结果
        let message;
        if (result.success) {
            message = 'You are now known as' + result.name + '.';
        } else {
            message = result.message;
        }
        msgNode.append(divSystemContentElement(message));
    });

    socket.on('joinResult', function(result) { //显示房间变更
        $('#room').text(result.room);
        msgNode.append(divSystemContentElement('Room changed'));
    });

    socket.on('message', function(message) {
        msgNode.append(divEscapedContentElement(message.text)); //显示接收到的信息
    });

    socket.on('rooms', function(rooms) {
        let roomList = $('#room-list');
        roomList.empty();
        for (var room in rooms) {
            room = room.substring(1, room.length);
            if (room !== '') {
                roomList.append(divEscapedContentElement(room));
            }
        }

        $('#room-list div').click(function() {
            chatApp.processCommand('/join' + $(this).text());
            inputFocus();
        });
    });

    setInterval(function() {
        socket.emit('rooms'); //定期请求房间列表
    }, 1000);

    inputFocus();

    $('#send-form').submit(() => {
        processUserInpit(chatApp, socket); //提交表单发送聊信息
        return false;
    });
});