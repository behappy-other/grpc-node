var PROTO_PATH = __dirname + '/../../protos/helloworld.proto';
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
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
const interceptors = (methodDescription, call) => {
  return new grpc.ServerInterceptingCall(call, {
    start: next => {
      next({
        onReceiveMetadata: (metadata, mdNext) => {
          mdNext(metadata);
        },
      });
    },
  });
};
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
