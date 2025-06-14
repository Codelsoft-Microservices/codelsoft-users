/* eslint-disable import/first */
/* eslint-disable no-console */
import { config } from "dotenv";
import { connectDB } from "./src/utils/mongoORM.js";
import { ServerCredentials, Server } from "@grpc/grpc-js";
import { loadProto } from "./src/utils/loadProto.js";
import usersService from "./src/services/usersService.js";

const environments = {
  development: "Desarrollo",
  production: "Producción",
};

process.on("uncaughtException", (err) => {
  console.log("UNCAUGHT EXCEPTION! Apagando el servidor...");
  console.log(err.name, err.message);
  process.exit(1);
});

config({ path: "./.env" });

const server = new Server();

const DB = process.env.MONGO_DATABASE.replace(
  "<PASSWORD>",
  process.env.MONGO_PASSWORD
).replace("<USER>", process.env.MONGO_USER);

connectDB().then(() => console.log("✓ Conexión a base de datos exitosa"));

const usersProto = loadProto("users");
server.addService(usersProto.Users.service, usersService);

server.bindAsync(
  `${process.env.SERVER_URL}:${process.env.PORT || 3000}`,
  ServerCredentials.createInsecure(),
  (error, port) => {
    if (error) {
      console.error("Server failed to bind:", error);
    } else {
      console.log(
        `- Entorno:      ${environments[process.env.NODE_ENV || "development"]}`
      );
      console.log(`- Puerto:       ${port}`);
      console.log(
        `- URL:          ${process.env.SERVER_URL || "localhost"}:${port}`
      );
    }
  }
);