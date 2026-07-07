import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server } from "socket.io";
import { setIO } from "@/lib/socket-server";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

let io: Server;

export function getIO(): Server {
  return io;
}

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  io = new Server(httpServer, {
    cors: {
      origin: dev ? "http://localhost:3000" : process.env.CORS_ORIGIN,
      methods: ["GET", "POST"],
      credentials: true,
    },
    pingInterval: 10000,
    pingTimeout: 5000,
  });
  setIO(io);

  const vehicleRooms = new Map<string, string>();

  io.on("connection", (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    socket.on("join-tracking", (data: { bookingId?: string; vehicleId?: string; tripId?: string }) => {
      const { bookingId, vehicleId, tripId } = data;
      if (vehicleId) {
        socket.join(`vehicle:${vehicleId}`);
        vehicleRooms.set(socket.id, `vehicle:${vehicleId}`);
      }
      if (tripId) socket.join(`trip:${tripId}`);
      if (bookingId) socket.join(`booking:${bookingId}`);
    });

    socket.on("leave-tracking", (data: { vehicleId?: string; tripId?: string; bookingId?: string }) => {
      const { vehicleId, tripId, bookingId } = data;
      if (vehicleId) socket.leave(`vehicle:${vehicleId}`);
      if (tripId) socket.leave(`trip:${tripId}`);
      if (bookingId) socket.leave(`booking:${bookingId}`);
      vehicleRooms.delete(socket.id);
    });

    socket.on("gps-update", (data: {
      driver: string; vehicle: string; trip?: string; schedule?: string;
      latitude: number; longitude: number; altitude?: number; heading?: number;
      speed?: number; accuracy?: number; battery?: number; internet?: string;
    }) => {
      const liveData = {
        vehicle: data.vehicle,
        driver: data.driver,
        trip: data.trip,
        latitude: data.latitude,
        longitude: data.longitude,
        altitude: data.altitude,
        heading: data.heading,
        speed: data.speed || 0,
        battery: data.battery,
        timestamp: new Date(),
      };

      io.to(`vehicle:${data.vehicle}`).emit("location-update", liveData);
      if (data.trip) {
        io.to(`trip:${data.trip}`).emit("location-update", liveData);
      }
    });

    socket.on("driver-status", (data: { driverId: string; status: string; tripId?: string }) => {
      const { driverId, status, tripId } = data;
      if (tripId) {
        io.to(`trip:${tripId}`).emit("driver-status-change", {
          driverId, status, timestamp: new Date(),
        });
      }
    });

    socket.on("emergency-alert", (data: {
      tripId: string; type: string; notes?: string;
      latitude?: number; longitude?: number;
    }) => {
      io.emit("emergency", {
        ...data,
        timestamp: new Date(),
      });
    });

    socket.on("join-user", (userId: string) => {
      socket.join(`user:${userId}`);
    });

    socket.on("leave-user", (userId: string) => {
      socket.leave(`user:${userId}`);
    });

    socket.on("disconnect", () => {
      vehicleRooms.delete(socket.id);
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
  });

  httpServer.listen(port, () => {
    console.log(`> Sabari ready on http://${hostname}:${port}`);
    console.log(`> Socket.IO real-time tracking active`);
  });
});
