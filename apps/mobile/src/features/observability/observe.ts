import { Observe } from "expo-observe";

export const crashReportingAvailable = false;

export function setCrashReportsEnabled(_enabled: boolean): Promise<void> {
  Observe.configure({ dispatchingEnabled: false });
  return Promise.resolve();
}

void setCrashReportsEnabled(false);
