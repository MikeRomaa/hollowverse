import { withSentry } from '@sentry/nextjs';

const handler = async () => {
  throw new Error('API throw error test');
};

export const testApiError = withSentry(handler);
