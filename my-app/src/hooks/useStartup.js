import { useContext } from "react";
import StartupContext from "../contexts/startupContext";

function useStartup() {
  return useContext(StartupContext);
}

export default useStartup;
