const fallbackApi = {
  postMessage: (_message: unknown) => undefined
};

export interface VsCodeApiLike {
  postMessage(message: unknown): void;
}

export function getVsCodeApi(): VsCodeApiLike {
  const acquire = (globalThis as typeof globalThis & {
    acquireVsCodeApi?: () => VsCodeApiLike;
  }).acquireVsCodeApi;

  return typeof acquire === "function" ? acquire() : fallbackApi;
}
