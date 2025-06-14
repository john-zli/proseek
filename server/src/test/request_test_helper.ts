import { Mock, mock } from 'bun:test';

// Mock express types
export type MockRequest = {
  body?: any;
  query?: any;
  params?: any;
  session?: any;
  ip?: string;
  originalUrl?: string;
  method?: string;
  ipLocation?: any;
};

export type MockResponse = {
  status: Mock;
  json: Mock;
  sendFile: Mock;
};

export type MockNextFunction = Mock;

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
  const res = {
    status: mock(() => res),
    json: mock(),
    sendFile: mock(),
  };
  return res;
};

// Helper to create mock next function
export const createMockNext = (): MockNextFunction => mock();

// Store response reference for chaining
const res = createMockResponse();
