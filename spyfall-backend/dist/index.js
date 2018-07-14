'use strict';

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _http = require('http');

var _http2 = _interopRequireDefault(_http);

var _socket = require('socket.io');

var _socket2 = _interopRequireDefault(_socket);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var app = (0, _express2.default)();
var server = _http2.default.createServer(app);

var PORT = process.env.PORT || 8000;
var io = (0, _socket2.default)(server);

io.on('connection', function (socket) {});
server.listen(PORT, function () {
  console.log('server is on port ' + PORT);
});