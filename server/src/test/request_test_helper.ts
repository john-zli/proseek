import { Mock, mock } from 'bun:test';

// Mock express types
export type MockRequest = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  query?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  session?: any;
  ip?: string;
  originalUrl?: string;
  method?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ipLocation?: any;
};

export type MockResponse = {
  status: Mock<(code: number) => MockResponse>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  json: Mock<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sendFile: Mock<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  clearCookie: Mock<any>;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type MockNextFunction = Mock<any>;

// Helper to create mock request
export const createMockRequest = (overrides: Partial<MockRequest> = {}): MockRequest => ({
  body: {},
  query: {},
  params: {},
  session: {},
  ...overrides,
});

// Helper to create mock response
export const createMockResponse = (): MockResponse => {
  const res: MockResponse = {
    status: mock(() => res),
    json: mock(),
    sendFile: mock(),
    clearCookie: mock(),
  };
  return res;
};

// Helper to create mock next function
export const createMockNext = (): MockNextFunction => mock();

// Store response reference for chaining
export const mockResponse = createMockResponse();
