let io: any = null

export function setIO(instance: any) {
  io = instance
}

export function getIO(): any {
  return io
}

export function emitNotification(userId: string, notification: any) {
  if (io) {
    io.to(`user:${userId}`).emit("notification", notification)
  }
}
