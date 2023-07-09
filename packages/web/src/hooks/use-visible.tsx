import { useEffect, useState } from "react";

export const useVisible = (): boolean => {
  const [documentVisible, setDocumentVisible] = useState<boolean>(true);

  const visibilityChange = () => {
    setDocumentVisible(document.hidden ? false : true);
  };

  useEffect(() => {
    document.addEventListener("visibilitychange", visibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", visibilityChange);
    };
  }, []);

  return documentVisible;
};
