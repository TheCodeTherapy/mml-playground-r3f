import { createContext, useState, useEffect, useRef, useCallback, FC, ReactNode } from "react";
import { toast } from "react-toastify";

import { ClientUpdate, Network } from "./network";

export const NetworkContext = createContext<{
  connected: boolean;
  id: number | null;
  clientUpdates: Map<number, ClientUpdate>;
  sendUpdate?: (update: ClientUpdate) => void;
  deleteClient?: (clientId: number) => void;
} | null>(null);

type NetworkProviderProps = {
  children: ReactNode;
};

export const NetworkProvider: FC<NetworkProviderProps> = ({ children }) => {
  const executedOnce = useRef<boolean>(false);
  const retryCount = useRef<number>(0);

  const retryInterval = 3000;
  const maxRetryCount: number = 3;
  const packetsUpdateRate = (1 / 30) * 1000;

  const [network, setNetwork] = useState<Network | null>(null);
  const [connected, setConnected] = useState<boolean>(false);
  const [id, setId] = useState<number | null>(null);
  const [clientUpdates, setClientUpdates] = useState<Map<number, ClientUpdate>>(new Map());

  const sendUpdate = useCallback(
    (update: ClientUpdate) => {
      if (network) network.sendUpdate(update);
    },
    [network]
  );

  const deleteClient = useCallback(
    (clientId: number) => {
      if (network) {
        if (network.clientUpdates.get(clientId)) {
          network.clientUpdates.delete(clientId);
        }
      }
    },
    [network]
  );

  const connect = useCallback(() => {
    if (!network || retryCount.current >= maxRetryCount) return;
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    const connectionUrl = `${protocol}//${host}/network`;
    const showConnecting = () => {
      toast.info(`Connecting (attempt ${retryCount.current + 1}/${maxRetryCount})`, {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: false,
        progress: undefined,
        bodyClassName: "grow-font-size",
        theme: "dark",
      });
    };
    const showConnected = () => {
      toast.success(`Connected as ID: ${network.id}`, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: false,
        progress: undefined,
        bodyClassName: "grow-font-size",
        theme: "dark",
      });
    };
    showConnecting();
    console.log(`[Network] Connecting to ${connectionUrl} (attempt ${retryCount.current + 1}/${maxRetryCount})`);
    network.connection
      .connect(connectionUrl)
      .then(() => {
        executedOnce.current = true;
        setTimeout(showConnected, 2500);
        setConnected(true);
        setId(network.id);
        console.log(`[Network] CONNECTED to ${connectionUrl} as ID: ${network.id}`);
      })
      .catch(() => {
        console.log(`[Network] Failed to connect to ${connectionUrl}`);
        retryCount.current += 1;
        setTimeout(connect, retryInterval);
      });
  }, [network]);

  useEffect(() => {
    if (network === null) {
      setNetwork(new Network());
    } else if (executedOnce.current === false && network) {
      connect();
    }
  }, [connect, network]);

  useEffect(() => {
    if (network) {
      setClientUpdates(new Map(network.clientUpdates));
    }
  }, [network]);

  useEffect(() => {
    if (network) {
      const interval = setInterval(() => {
        setClientUpdates(new Map(network.clientUpdates));
      }, packetsUpdateRate);

      return () => clearInterval(interval);
    }
  }, [network, packetsUpdateRate]);

  return (
    <NetworkContext.Provider value={{ connected, id, clientUpdates, sendUpdate, deleteClient }}>
      {children}
    </NetworkContext.Provider>
  );
};
