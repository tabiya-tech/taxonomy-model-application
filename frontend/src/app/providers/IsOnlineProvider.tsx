import React, { createContext, useEffect, useState } from "react";

type IsOnlineProviderProps = {
  children: React.ReactNode;
};

export const IsOnlineContext = createContext<boolean>(navigator.onLine);

export const IsOnlineProvider: React.FC<IsOnlineProviderProps> = ({ children }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Perform the one-time comparison to ensure the initial value is correct
    if (isOnline !== navigator.onLine) {
      setIsOnline(navigator.onLine);
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [isOnline]);

  return <IsOnlineContext.Provider value={isOnline}>{children}</IsOnlineContext.Provider>;
};
