var PROTO_PATH = __dirname + '/../../protos/helloworld.proto';

var grpc = require('@grpc/grpc-js');
var protoLoader = require('@grpc/proto-loader');
var packageDefinition = protoLoader.loadSync(
  PROTO_PATH,
  {keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
  });
var hello_proto = grpc.loadPackageDefinition(packageDefinition).helloworld;

/*拦截器*/
function headerInterceptor(options, nextCall) {
  return new grpc.InterceptingCall(nextCall(options), {
    start: function(metadata, listener, next) {
      // 在metadata中添加自定义header
      metadata.add('trace-id', 'xxx');
      next(metadata, listener);
    }
  });
}
/*拦截器*/

const Koa = require('koa');
const {koaBody} = require('koa-body');
const app = new Koa();
// body parser
app.use(koaBody());

async function testMethod() {
  const client = new hello_proto.Greeter('localhost:50051', grpc.credentials.createInsecure(), {
    interceptors: [headerInterceptor]
  });
  const promise = new Promise((resolve, reject) => {
    client.sayHello({name: 'xiaowu'}, (error, response) => {
      if (error) {
        reject(error)
      } else {
        resolve(response)
      }
    });
  });
  return promise
}

app.use(async (ctx, next) => {
  if (ctx.path === '/test' && ctx.method === 'GET'){
    const res = await testMethod();
    console.log(res)
    return ctx.body = res
  }
  await next()
});

// error handler
app.on('error', async (err, ctx) => {
  ctx.status = 500;
  console.error('×××××× System error:', err.stack);
});

const port = 3000;
app.listen(port, '0.0.0.0')
  .on('listening', () => {
    console.log(`Listening on port: ${port}`);
  });
