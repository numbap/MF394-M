// crypto.getRandomValues() is not available in React Native Hermes.
// Counter ensures uniqueness even during bulk operations in the same millisecond.
let counter = 0;
export const generateId = (): string =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}-${(++counter).toString(36)}`;
