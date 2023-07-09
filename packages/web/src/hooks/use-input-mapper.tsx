import { useEffect, useState } from "react";

export const useInputMapper = () => {
  const [keysPressed, setKeysPressed] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      setKeysPressed((keys) => ({ ...keys, [event.key.toLowerCase()]: true }));
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      setKeysPressed((keys) => ({ ...keys, [event.key.toLowerCase()]: false }));
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  return {
    forward: keysPressed.w,
    backward: keysPressed.s,
    left: keysPressed.a,
    right: keysPressed.d,
    run: keysPressed.shift,
    jump: keysPressed[" "],
    anyDirection: keysPressed.w || keysPressed.s || keysPressed.a || keysPressed.d,
    conflictingDirection: (keysPressed.a && keysPressed.d) || (keysPressed.w && keysPressed.s),
  };
};
