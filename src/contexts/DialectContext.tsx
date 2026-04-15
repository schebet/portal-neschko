import { createContext, useContext, useState, ReactNode } from "react";
import { DialectZone } from "@/lib/types";
import { translateToDialect } from "@/lib/dialectTranslation";

interface DialectContextType {
  dialect: DialectZone;
  setDialect: (d: DialectZone) => void;
  t: (text: string) => string;
}

const DialectContext = createContext<DialectContextType>({
  dialect: "Стандардни српски",
  setDialect: () => {},
  t: (text) => text,
});

export function DialectProvider({ children }: { children: ReactNode }) {
  const [dialect, setDialect] = useState<DialectZone>("Стандардни српски");

  const t = (text: string) => translateToDialect(text, dialect);

  return (
    <DialectContext.Provider value={{ dialect, setDialect, t }}>
      {children}
    </DialectContext.Provider>
  );
}

export const useDialect = () => useContext(DialectContext);
