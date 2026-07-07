"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { Bell, X, Check, ExternalLink, Loader2 } from "lucide-react"
import { cn, formatDate, formatTime } from "@/lib/utils"
import axios from "axios"
import { io, type Socket } from "socket.io-client"
import { useRouter } from "next/navigation"

interface NotificationItem {
  _id: string
  title: string
  message: string
  type: string
  read: boolean
  data?: Record<string, any>
  createdAt: string
}

export function NotificationBell() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    setToken(localStorage.getItem("sabari_token"))
  }, [])

  const fetchNotifications = async () => {
    if (!token) {
      setLoading(false)
      return
    }
    try {
      const [listRes, countRes] = await Promise.all([
        axios.get("/api/notifications?limit=10", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("/api/notifications/unread-count", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ])
      setNotifications(listRes.data.notifications || [])
      setUnreadCount(countRes.data.count || 0)
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [token])

  useEffect(() => {
    if (!token) return

    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "", { transports: ["websocket", "polling"] })
    socketRef.current = socket

    socket.on("connect", () => {
      const userId = localStorage.getItem("sabari_user_id")
      if (userId) {
        socket.emit("join-user", userId)
      }
    })

    socket.on("notification", (notification: NotificationItem) => {
      setNotifications((prev) => [notification, ...prev].slice(0, 10))
      setUnreadCount((prev) => prev + 1)
    })

    return () => {
      socket.disconnect()
    }
  }, [token])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const markAsRead = async (id: string) => {
    try {
      await axios.put(`/api/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch {}
  }

  const markAllAsRead = async () => {
    const unread = notifications.filter((n) => !n.read)
    await Promise.all(unread.map((n) => markAsRead(n._id)))
  }

  if (!token) return null

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => {
          setOpen(!open)
          if (!open) fetchNotifications()
        }}
        className="relative p-2 text-zinc-400 hover:text-zinc-900 transition-colors"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-red-500 rounded-full">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-xl border border-zinc-200 bg-white shadow-xl z-50 max-h-[480px] flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200">
            <h3 className="text-sm font-semibold text-zinc-900">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-violet-600 hover:text-violet-700"
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-zinc-500" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="h-8 w-8 mx-auto text-zinc-300 mb-2" />
                <p className="text-sm text-zinc-500">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  className={cn(
                    "px-4 py-3 border-b border-zinc-100 hover:bg-zinc-50 transition-colors cursor-pointer",
                    !n.read && "bg-violet-50"
                  )}
                  onClick={() => {
                    if (!n.read) markAsRead(n._id)
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-sm", !n.read ? "text-zinc-900 font-medium" : "text-zinc-700")}>
                        {n.title}
                      </p>
                      <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-[10px] text-zinc-600 mt-1">
                        {formatDate(n.createdAt)} at {formatTime(n.createdAt)}
                      </p>
                    </div>
                    {!n.read && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          markAsRead(n._id)
                        }}
                        className="shrink-0 p-1 text-zinc-400 hover:text-violet-600"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <Link
              href="/notifications"
              className="block text-center text-xs text-violet-600 hover:text-violet-700 py-3 border-t border-zinc-200"
              onClick={() => setOpen(false)}
            >
              View all notifications
              <ExternalLink className="h-3 w-3 inline ml-1" />
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
