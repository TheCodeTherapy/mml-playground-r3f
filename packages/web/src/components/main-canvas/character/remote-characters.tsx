import { useEffect } from "react";

import { useNetwork } from "../../../network/use-network";

import { Character } from "./character";

export const RemoteCharacters = () => {
  const { connected, id, clientUpdates, deleteClient } = useNetwork();

  useEffect(() => {
    if (clientUpdates.get(0)) {
      if (deleteClient) deleteClient(0);
    }
  }, [clientUpdates, deleteClient]);

  return (
    <>
      {Array.from(clientUpdates.keys()).map((clientId) => {
        if (clientId !== id && connected) {
          return <Character isLocal={false} clientId={clientId} key={clientId} />;
        }
        return null;
      })}
    </>
  );
};
