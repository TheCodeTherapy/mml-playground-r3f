import { Perf } from "r3f-perf";

import { useToggle } from "../../../hooks/use-toggle";

export const PerformanceMonitor = (props: { showByDefault?: boolean }) => {
  const on = useToggle(!!props.showByDefault, "p");
  return <Perf position="bottom-right" style={{ display: on ? "unset" : "none" }} />;
};
