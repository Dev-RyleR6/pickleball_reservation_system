import * as React from "react";
import AppRouter from "./routes/AppRouter";
import { NotificationProvider } from "./context/NotificationContext";
import { SocketProvider } from "./context/SocketContext";

const App: React.FC = () => {
  return (
    <SocketProvider>
      <NotificationProvider>
        <AppRouter />
      </NotificationProvider>
    </SocketProvider>
  );
};

export default App;
