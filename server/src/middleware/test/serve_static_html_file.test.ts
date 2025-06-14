import { describe, expect, test } from 'bun:test';
import { Request, Response } from 'express';
import path from 'path';

import { serveStaticHtmlFile } from '../serve_static_html_file';
import { createMockRequest, createMockResponse } from '@server/test/request_test_helper';

describe('serve static HTML file middleware', () => {
  test('should serve index.html file', () => {
    // Create mock request
    const req = createMockRequest() as unknown as Request;

    // Create mock response
    const res = createMockResponse() as unknown as Response;

    // Get middleware function
    const middleware = serveStaticHtmlFile();

    // Call middleware
    middleware(req, res);

    // Verify file was served
    expect(res.sendFile).toHaveBeenCalledWith(path.join(__dirname, '../../../../client/dist/index.html'));
  });
});
