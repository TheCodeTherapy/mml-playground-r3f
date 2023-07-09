import { autorun, IReactionDisposer } from "mobx";
import { useState, useEffect } from "react";

export const useObservable = <T>(getter: () => T): T => {
  const [value, setValue] = useState(getter);

  useEffect(() => {
    const disposer: IReactionDisposer = autorun(() => {
      setValue(getter());
    });

    return () => {
      disposer();
    };
  }, [getter]);

  return value;
};
