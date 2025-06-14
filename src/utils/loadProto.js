import { loadPackageDefinition } from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";
import path from "path";

export function loadProto(serviceName) {
  const PROTO_PATH = path.join("src", "protos", `${serviceName}.proto`);
  const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
  });

  return loadPackageDefinition(packageDefinition)[serviceName];
}