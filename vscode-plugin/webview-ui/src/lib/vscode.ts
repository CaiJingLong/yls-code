const fallbackApi = {
  postMessage: (_message: unknown) => undefined,
  getState: () => undefined,
  setState: <T>(state: T) => state
};

export interface VsCodeApiLike {
  postMessage(message: unknown): void;
  getState<T>(): T | undefined;
  setState<T>(state: T): T;
}

export function getVsCodeApi(): VsCodeApiLike {
  const acquire = (globalThis as typeof globalThis & {
    acquireVsCodeApi?: () => VsCodeApiLike;
  }).acquireVsCodeApi;

  return typeof acquire === "function" ? acquire() : fallbackApi;
}
