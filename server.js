'use strict'

const http = require('http'); //http模块，提供HTTP服务器和客户端功能
const fs = require('fs'); //系统文件读写相关功能
const path = require('path'); //文件系统路径相关功能
const mime = require('mime'); //根据文件扩展名得出mime类型
const chatServer = require('./lib/chat_server');

let cache = {};


//发送404错误
function send404(res) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.write('Error 404: resource not found.');
    res.end();
}

//发送文件数据
function sendFile(res, filePath, fileContents) {
    res.writeHead(200, {
        'Content-Type': mime.lookup(path.basename(filePath))
    });
    res.end(fileContents);
}

//提供静态文件服务
function serveStatic(res, cache, absPath) {
    if (cache[absPath]) { //检查文件是否在缓存中
        sendFile(res, absPath, cache[absPath]);
    } else {
        fs.exists(absPath, function(exists) {
            if (exists) {
                fs.readFile(absPath, function(err, data) {
                    if (err) {
                        send404(res);
                    } else {
                        cache[absPath] = data; //缓存数据
                        sendFile(res, absPath, data); //从硬盘中读取文件
                    }
                })
            } else {
                send404(res);
            }
        })
    }
}


const hostname = '127.0.0.1';
const port = 3000; //1024以上,windows上1024以下也可以

const server = http.createServer((req, res) => {
    let filePath = false;
    if (req.url == '/') {
        filePath = 'public/index.html'; //返回默认的html文件
    } else {
        filePath = 'public' + req.url; //转换成相对路径
    }

    let absPath = './' + filePath;
    serveStatic(res, cache, absPath); //返回静态文件

    /*
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain');
    res.end('Hello World\n');*/
});

server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
});
chatServer.listen(server);