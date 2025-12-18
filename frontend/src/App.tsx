import * as React from "react";
import AppRouter from "./routes/AppRouter";
import { NotificationProvider } from "./context/NotificationContext";

const App: React.FC = () => {
  return (
    <NotificationProvider>
      <AppRouter />
    </NotificationProvider>
  );
};

export default App;
