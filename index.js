var express = require("express");
const moment = require("moment");
const shortid = require('shortid');
const cookie = require('cookie');
const md5 = require('md5');
const { request } = require("http");
const { response } = require("express");
var app = express();

const port = 8080

var server = require("http").Server(app);
var io = require("socket.io")(server);
server.listen(port)
let users = [
    {
        email: 'huong@gmail.com',
        username: 'thuhuong',
        password: '123456',
        id: 'nTBpbcoBB',
        idSocket: '',
        active: false,
        room: [ '1' ]
      },
      {
        email: 'quynh@gmail.com',
        username: 'nhuquynh',
        password: '123456',
        id: 'Rk0xPjPRYB',
        idSocket: '',
        active: false,
        room: [ '1' ]
      },
      {
        email: 'duong@gmail.com',
        username: 'anhduong',
        password: '123456',
        id: 'Mo6BQlqsiS',
        idSocket: '',
        active: false,
        room: [ '1' ]
      }
];
let RoomChat = [
    {
        id: '1',
        nameroom: 'Chat Group All',
        active: true,
        members: [],
        memberActive: [],
        mesenger: []
    }
]

io.on("connection", function(socket) {
    res.cookie('rememberme', '1', { expires: new Date(Date.now() + 900000), httpOnly: true })
    
    // socket.once("disconnect", () => {
    //     let index = -1;
    //     if (users.length >= 0) {
    //         index = users.findIndex(e => e.id == socket.id);
    //     }
    //     if (index >= 0)
    //         users.splice(index, 1);
    //     io.emit("users", JSON.stringify(users));
    // });
    socket.on('register', function(data){
        if(users.length === 0 ) {
            data.id = shortid.generate()
            data.active = false
            data.idSocket = ''
            data.room = []
            data.room.push('1')
            users.push(data)
            socket.emit('register_success')
            RoomChat[0].members.push(data.id)
            io.emit('users-register', users)
        } else {
            if(users.every( (item, index) => item.email === data.email)) {
                socket.emit('register_failure', 'Tài khoản email đã tồn tại')
            } else {
                data.id = shortid.generate()
                data.id = shortid.generate()
                data.active = false
                data.idSocket = ''
                data.room = []
                data.room.push('1')
                users.push(data)
                socket.emit('register_success')
                RoomChat[0].members.push(data.id)
                io.emit('users-register', users)
            }
        }
    })
    socket.on('login', function(data){
        let index = users.findIndex(item => item.username === data.username && item.password === data.password)
        if(index >= 0) {
            users = [
                ...users.slice(0, index),
                {
                    ...users[index],
                    idSocket: socket.id,
                    active: true,
                },
                ...users.slice(index+1,users.length)
            ]
            data = {
                ...data,
                id: users[index].id,
                email: users[index].email
            }
            socket.emit('login_success', data)
            io.emit('users', {users: users, userLogin: data})

            var date = new Date();
            date.setTime(date.getTime()+(30*60*1000)); // set day value to expiry
            var expires = "; expires="+date.toGMTString();

            socket.handshake.headers.cookie = 'userId'+"="+data.id+expires+"; path=/";

            // console.log(RoomChat.filter(item => users[index].room.indexOf(item.id)>=0))
            socket.emit('getRoomChatUsers', RoomChat.filter(item => users[index].room.indexOf(item.id)>=0))
            socket.emit('getGroupChatActive', RoomChat[0])
            // console.log(users)
        } else {
            socket.emit('login_failure', data)
        }
    })
    socket.on("sendMsg", msgTo => {
        msgTo = JSON.parse(msgTo);
        // console.log(msgTo)
        let index = RoomChat.findIndex(item=>item.id === msgTo.groupActiveId)
        const minutes = new Date().getMinutes();
        RoomChat[index].mesenger.push({
            id: msgTo.user.id,
            userName: msgTo.user.username,
            msg: msgTo.msg,
            time: new Date().getHours() + ":" + (minutes < 10 ? "0" + minutes : minutes)
        })
        
        io.emit("getMsg",RoomChat[index])
    });

    let chatGroupList = {};
    // Creating group chat
    socket.on('createChatGroup', data => {
        let indexUserLoggin = users.findIndex(item => item.id == data.masterName)
        if(RoomChat.findIndex(item=>item.id === data.roomId) >= 0) {
            console.log('Room đã tồn tại')
        } else {
            console.log('tạo phòng chat mới')
            RoomChat.push( {
                id: data.roomId,
                nameroom: data.chatGroupName,
                active: true,
                members: data.members,
                memberActive: [],
                mesenger: []
            })
            data.members.forEach(element => {
                let index = users.findIndex(item=> item.id === element)
                users[index].room.push(data.roomId)
            });
            socket.emit('getRoomChatUsers', RoomChat.filter(item => users[indexUserLoggin].room.indexOf(item.id)>=0))
        }
        let RoomActiveId = RoomChat.find(item => item.id === data.roomId)

        socket.emit('getGroupChatActive', RoomActiveId)
    })
   
})
