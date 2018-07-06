const Hapi = require('hapi');

const server = Hapi.server({
  port: 8080,
  host: 'localhost',
  routes: { cors: true }
});

server.route({
  method: 'GET',
  path: '/',
  handler: async(request, h) => {

    return 'Hello, world!';
  }
});

//1048576 bytes = 1MB

server.route({
  method: 'POST',
  path: '/upload',
  config: {
    payload: {
        maxBytes: 1048576,
        output: 'file',
        parse: true
    }
  },
  handler: async(req, h) => {
    const payload = req.payload;

    console.log(req.payload)

    return 'Recived your data'
  }
})

const init = async() => {

  await server.start();
  console.log(`Server running at: ${server.info.uri}`);
};

process.on('unhandledRejection', (err) => {

  console.log(err);
  process.exit(1);
});

init();
