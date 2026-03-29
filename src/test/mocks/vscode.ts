export enum ColorThemeKind {
  Light = 1,
  Dark = 2,
  HighContrast = 3,
  HighContrastLight = 4
}

class Disposable {
  dispose(): void {}
}

export const window = {
  activeColorTheme: {
    kind: ColorThemeKind.Light
  },
  registerWebviewViewProvider: () => new Disposable(),
  onDidChangeActiveColorTheme: () => new Disposable()
};

export const workspace = {
  getConfiguration: () => ({
    get: <T>(_key: string, defaultValue: T) => defaultValue
  }),
  onDidChangeConfiguration: () => new Disposable()
};

export const commands = {
  executeCommand: async () => undefined,
  registerCommand: () => new Disposable()
};

export const Uri = {
  joinPath: (...segments: Array<{ fsPath?: string } | string>) => ({
    fsPath: segments
      .map((segment) => (typeof segment === "string" ? segment : segment.fsPath ?? ""))
      .filter(Boolean)
      .join("/"),
    toString() {
      return this.fsPath;
    }
  })
};
