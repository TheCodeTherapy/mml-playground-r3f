import { useCallback, useEffect, useState } from "react";

import { caseInsensitiveMatch } from "../helpers/js-helpers";

export function useToggle(initialValue: boolean, key: string) {
  const [on, toggle] = useState(initialValue);
  const handleToggle = useCallback(
    (e: KeyboardEvent) => {
      if (caseInsensitiveMatch(e.key, key)) toggle(!on);
    },
    [on, key]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleToggle);
    return () => {
      window.removeEventListener("keydown", handleToggle);
    };
  }, [handleToggle]);

  return on;
}
