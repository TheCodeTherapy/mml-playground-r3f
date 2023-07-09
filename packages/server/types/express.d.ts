declare namespace Express {
  export interface Application {
    ws: (route: string, ...middleware: any[]) => any;
  }
}
