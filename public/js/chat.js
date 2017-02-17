'use strict'
// 初始化
const Chat = function (socket) {
    this.socket = socket
}

// 发送聊天消息
Chat.prototype.sendMessage = function (room, text) {
    let message = {
        room,
        text
    }
    this.socket.emit('message', message)
}

// 变更房间
Chat.prototype.changeRoom = function (room) {
    this.socket.emit('join', {newRoom: room})
}

// 修改名称
Chat.prototype.nameAttempt = function (name) {
    this.socket.emit('nameAttempt', name)
}

// 处理命令
Chat.prototype.processCommand = function (command) {
    let words = command.split(' ')
    let message = false

    command = words[0].substring(1, words[0].length).toLowerCase()

    switch (command) {
        case 'join':
            words.shift()
            let room = words.join(' ')
            this.changeRoom(room)
            break
        case 'nick':
            words.shift()
            let name = words.join(' ')
            this.nameAttempt(name)
            break
        default:
            message = 'Unrecognized command'
            break
    }
    return message
}