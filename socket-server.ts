import { Server } from "socket.io"
import mongoose from "mongoose"

const PORT = parseInt(process.env.SOCKET_PORT || "3001", 10)
const MONGODB_URI = process.env.MONGODB_URI || ""

const gpsLogSchema = new mongoose.Schema({
  driver: { type: mongoose.Schema.Types.ObjectId, ref: "Driver" },
  vehicle: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle" },
  trip: { type: mongoose.Schema.Types.ObjectId, ref: "Trip" },
  latitude: Number, longitude: Number, altitude: Number,
  heading: Number, speed: Number, accuracy: Number,
  battery: Number, internet: String,
  timestamp: { type: Date, default: Date.now },
}, { strict: false, timestamps: true })
const GPSLog = mongoose.model("GPSLog", gpsLogSchema)

const vehicleLogSchema = new mongoose.Schema({
  vehicle: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle" },
  driver: { type: mongoose.Schema.Types.ObjectId, ref: "Driver" },
  event: String, details: String,
  latitude: Number, longitude: Number,
  timestamp: { type: Date, default: Date.now },
}, { strict: false, timestamps: true })
const VehicleLog = mongoose.model("VehicleLog", vehicleLogSchema)

async function main() {
  if (MONGODB_URI) {
    await mongoose.connect(MONGODB_URI)
    console.log("[Socket.IO] Connected to MongoDB")
  }

  const io = new Server(PORT, {
    cors: {
      origin: process.env.CORS_ORIGIN || "*",
      methods: ["GET", "POST"],
      credentials: true,
    },
    pingInterval: 10000,
    pingTimeout: 5000,
  })

  console.log(`[Socket.IO] Server running on port ${PORT}`)

  const vehicleRooms = new Map<string, string>()

  io.on("connection", (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`)

    socket.on("join-tracking", (data: { bookingId?: string; vehicleId?: string; tripId?: string }) => {
      const { bookingId, vehicleId, tripId } = data
      if (vehicleId) {
        socket.join(`vehicle:${vehicleId}`)
        vehicleRooms.set(socket.id, `vehicle:${vehicleId}`)
      }
      if (tripId) socket.join(`trip:${tripId}`)
      if (bookingId) socket.join(`booking:${bookingId}`)
    })

    socket.on("leave-tracking", (data: { vehicleId?: string; tripId?: string; bookingId?: string }) => {
      const { vehicleId, tripId, bookingId } = data
      if (vehicleId) socket.leave(`vehicle:${vehicleId}`)
      if (tripId) socket.leave(`trip:${tripId}`)
      if (bookingId) socket.leave(`booking:${bookingId}`)
      vehicleRooms.delete(socket.id)
    })

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
      }

      io.to(`vehicle:${data.vehicle}`).emit("location-update", liveData)
      if (data.trip) {
        io.to(`trip:${data.trip}`).emit("location-update", liveData)
      }

      if (MONGODB_URI) {
        GPSLog.create(liveData).catch((err) => console.error("[Socket.IO] GPS save error:", err.message))
      }
    })

    socket.on("driver-status", (data: { driverId: string; status: string; tripId?: string }) => {
      const { driverId, status, tripId } = data
      if (tripId) {
        io.to(`trip:${tripId}`).emit("driver-status-change", {
          driverId, status, timestamp: new Date(),
        })
      }
    })

    socket.on("emergency-alert", (data: {
      tripId: string; type: string; notes?: string;
      latitude?: number; longitude?: number;
    }) => {
      io.emit("emergency", {
        ...data,
        timestamp: new Date(),
      })

      if (MONGODB_URI && data.latitude && data.longitude) {
        VehicleLog.create({
          event: "emergency",
          details: `${data.type}: ${data.notes || ""}`,
          latitude: data.latitude,
          longitude: data.longitude,
        }).catch((err) => console.error("[Socket.IO] Emergency log error:", err.message))
      }
    })

    socket.on("join-user", (userId: string) => {
      socket.join(`user:${userId}`)
    })

    socket.on("leave-user", (userId: string) => {
      socket.leave(`user:${userId}`)
    })

    socket.on("disconnect", () => {
      vehicleRooms.delete(socket.id)
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`)
    })
  })
}

main().catch((err) => {
  console.error("[Socket.IO] Failed to start:", err)
  process.exit(1)
})
