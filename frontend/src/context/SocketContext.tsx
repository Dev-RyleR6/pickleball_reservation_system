import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "../hooks/useAuth";
import type { Reservation } from "../types/reservation";
import type { Court } from "../types/court";
import type { User } from "../types/user";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!user) {
      // Disconnect socket if user logs out
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // Get token from localStorage
    const token = localStorage.getItem("token");
    if (!token) {
      console.warn("No token found, cannot connect to WebSocket");
      return;
    }

    // Create socket connection
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
    const newSocket = io(apiBaseUrl, {
      auth: {
        token: token,
      },
      transports: ["websocket", "polling"],
    });

    newSocket.on("connect", () => {
      console.log("WebSocket connected");
      setIsConnected(true);
    });

    newSocket.on("disconnect", () => {
      console.log("WebSocket disconnected");
      setIsConnected(false);
    });

    newSocket.on("connect_error", (error) => {
      console.error("WebSocket connection error:", error);
      setIsConnected(false);
    });

    setSocket(newSocket);

    // Cleanup on unmount or user change
    return () => {
      newSocket.disconnect();
      setSocket(null);
      setIsConnected(false);
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};

// Hook for listening to reservation events
export const useReservationSocket = (
  onReservationCreated?: (reservation: Reservation) => void,
  onReservationUpdated?: (reservation: Reservation) => void,
  onReservationApproved?: (reservation: Reservation) => void,
  onReservationCancelled?: (reservation: Reservation) => void
) => {
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    if (onReservationCreated) {
      socket.on("reservation:created", (data: { reservation: Reservation }) => {
        onReservationCreated(data.reservation);
      });
    }

    if (onReservationUpdated) {
      socket.on("reservation:updated", (data: { reservation: Reservation }) => {
        onReservationUpdated(data.reservation);
      });
    }

    if (onReservationApproved) {
      socket.on("reservation:approved", (data: { reservation: Reservation }) => {
        onReservationApproved(data.reservation);
      });
    }

    if (onReservationCancelled) {
      socket.on("reservation:cancelled", (data: { reservation: Reservation }) => {
        onReservationCancelled(data.reservation);
      });
    }

    return () => {
      if (onReservationCreated) socket.off("reservation:created");
      if (onReservationUpdated) socket.off("reservation:updated");
      if (onReservationApproved) socket.off("reservation:approved");
      if (onReservationCancelled) socket.off("reservation:cancelled");
    };
  }, [socket, onReservationCreated, onReservationUpdated, onReservationApproved, onReservationCancelled]);
};

// Hook for listening to court events
export const useCourtSocket = (
  onCourtCreated?: (court: Court) => void,
  onCourtUpdated?: (court: Court) => void,
  onCourtDeleted?: (courtId: number) => void,
  onCourtStatusChanged?: (court: Court) => void
) => {
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    if (onCourtCreated) {
      socket.on("court:created", (data: { court: Court }) => {
        onCourtCreated(data.court);
      });
    }

    if (onCourtUpdated) {
      socket.on("court:updated", (data: { court: Court }) => {
        onCourtUpdated(data.court);
      });
    }

    if (onCourtDeleted) {
      socket.on("court:deleted", (data: { courtId: number }) => {
        onCourtDeleted(data.courtId);
      });
    }

    if (onCourtStatusChanged) {
      socket.on("court:status_changed", (data: { court: Court }) => {
        onCourtStatusChanged(data.court);
      });
    }

    return () => {
      if (onCourtCreated) socket.off("court:created");
      if (onCourtUpdated) socket.off("court:updated");
      if (onCourtDeleted) socket.off("court:deleted");
      if (onCourtStatusChanged) socket.off("court:status_changed");
    };
  }, [socket, onCourtCreated, onCourtUpdated, onCourtDeleted, onCourtStatusChanged]);
};

// Hook for listening to user events (admin side)
export const useUserSocket = (
  onUserCreated?: (user: User) => void,
  onUserUpdated?: (user: User) => void,
  onUserDeleted?: (userId: number) => void
) => {
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    if (onUserCreated) {
      socket.on("user:created", (data: { user: User }) => {
        onUserCreated(data.user);
      });
    }

    if (onUserUpdated) {
      socket.on("user:updated", (data: { user: User }) => {
        onUserUpdated(data.user);
      });
    }

    if (onUserDeleted) {
      socket.on("user:deleted", (data: { userId: number }) => {
        onUserDeleted(data.userId);
      });
    }

    return () => {
      if (onUserCreated) socket.off("user:created");
      if (onUserUpdated) socket.off("user:updated");
      if (onUserDeleted) socket.off("user:deleted");
    };
  }, [socket, onUserCreated, onUserUpdated, onUserDeleted]);
};

