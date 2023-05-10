const http = require('http');

const routes = require('./routes');

console.log(routes.someText);

// const server = http.createServer(routes);
const server = http.createServer(routes.handler);

server.listen(3000);