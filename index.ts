import { create, Server } from "./src/server"

const server: Server = create(process.argv.slice(2));

server.run();
