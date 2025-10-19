interface CapConfig {
  apiEndpoint: string;
}

interface Window {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Cap: new (config: CapConfig) => any;
}
