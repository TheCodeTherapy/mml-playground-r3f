import { useNetwork } from "../../../network/use-network";

import { CharacterControllerLocal } from "./character-controller-local";
import { CharacterControllerRemote } from "./character-controller-remote";
import { CharacterModel } from "./character-model";

export const Character = (props: { isLocal: boolean; clientId?: number }) => {
  const { isLocal, clientId } = props;

  const { id: localId } = useNetwork();

  if (!isLocal && clientId !== undefined) {
    return (
      <>
        {clientId !== 0 && (
          <CharacterControllerRemote clientId={clientId}>
            {(characterState) => <CharacterModel characterState={characterState} isLocal={false} id={clientId} />}
          </CharacterControllerRemote>
        )}
      </>
    );
  }

  return (
    <>
      {isLocal && localId && (
        <CharacterControllerLocal>
          {(characterState) => <CharacterModel characterState={characterState} isLocal={true} id={localId} />}
        </CharacterControllerLocal>
      )}
    </>
  );
};
