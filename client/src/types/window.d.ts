interface CapConfig {
  apiEndpoint: string;
}

interface Window {
  Cap: new (config: CapConfig) => any;
}
