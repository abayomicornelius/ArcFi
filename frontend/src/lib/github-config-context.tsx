"use client";

import { createContext, useContext } from "react";

const GithubConfigContext = createContext(false);

export function GithubConfigProvider({ configured, children }: { configured: boolean; children: React.ReactNode }) {
  return <GithubConfigContext.Provider value={configured}>{children}</GithubConfigContext.Provider>;
}

export function useGithubConfigured() {
  return useContext(GithubConfigContext);
}
