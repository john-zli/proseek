interface CapConfig {
  apiEndpoint: string;
}

interface Window {
  Cap: new (element: HTMLElement, config: CapConfig) => any;
}
