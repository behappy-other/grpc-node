var PROTO_PATH = __dirname + '/../../protos/helloworld.proto';
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const {next} = require("lodash/seq");
// 加载.proto文件
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});
const hello_proto = grpc.loadPackageDefinition(packageDefinition).helloworld;

/*拦截器*/
function interceptors(methodDescriptor, call) {
  const self = call;
  const lastTime = Date.now();
  const listener = new grpc.ServerListenerBuilder()
    .withOnReceiveMessage((message, next) => {
      const self = call;
      console.log(`Receive a message ${JSON.stringify(message)} at ${(new Date()).toISOString()}`);
      next(message);
    }).withOnReceiveMetadata((metadata, next) => {
      const self = call;
      console.log('path: ',call.handler.path)
      console.log(`Receive a message ${JSON.stringify(metadata)} at ${(new Date()).toISOString()}`);
      next(metadata);
    }).build();
  const responder = new grpc.ResponderBuilder()
    .withStart(next => {
      const self = call;
      console.log(`Start at ${(new Date()).toISOString()}`);
      next(listener);
    })
    .withSendMessage((message, next) => {
      console.log(`Send a message ${JSON.stringify(message)} at ${(new Date()).toISOString()}`);
      next(message);
    })
    .withSendStatus((message, next) => {
      const self = call;
      const diffTime = Date.now() - lastTime;
      console.log(`Send a Status after ${diffTime},ms`);
      next(message);
    }).build();
  return new grpc.ServerInterceptingCall(call, responder);
}

/*拦截器*/

function sayHello(call, callback) {
  // 实现逻辑
  callback(null, {message: 'Hello ' + call.request.name});
}

// 创建gRPC服务器
const server = new grpc.Server({interceptors: [interceptors]});
server.addService(hello_proto.Greeter.service, {sayHello: sayHello});
server.bindAsync('0.0.0.0:50051', grpc.ServerCredentials.createInsecure(), () => {
  console.log('Server Starting...')
});
