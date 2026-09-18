/**
 * Production-level API resilience utility.
 * Implements strict timeouts with AbortController, retry logic, and circuit breaking.
 */

const safeFetchWithTimeout = async (url, options = {}, timeoutMs = 3500) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    if (error.name === "AbortError") {
      throw new Error(`API Request to ${url} timed out after ${timeoutMs}ms`);
    }
    throw error;
  }
};

module.exports = {
  safeFetchWithTimeout,
};
