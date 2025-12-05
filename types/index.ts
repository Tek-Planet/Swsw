declare module 'expo-router' {
  export interface InitialRoutes {
    "/event/[id]": { id: string };
    "/gallery/[id]": { id: string };
  }
}