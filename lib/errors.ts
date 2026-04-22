export class AppError extends Error {
  constructor(
    // eslint-disable-next-line no-unused-vars
    public readonly code: string,
    message: string,
    // eslint-disable-next-line no-unused-vars
    public readonly statusCode: number = 500,
    // eslint-disable-next-line no-unused-vars
    public readonly details?: Record<string, string>,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, string>) {
    super("VALIDATION_ERROR", message, 422, details);
    this.name = "ValidationError";
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super("NOT_FOUND", `${resource} not found`, 404);
    this.name = "NotFoundError";
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super("UNAUTHORIZED", message, 401);
    this.name = "UnauthorizedError";
  }
}

export class TenantIsolationError extends AppError {
  constructor() {
    super("TENANT_ISOLATION_VIOLATION", "Access denied: tenant isolation violation", 403);
    this.name = "TenantIsolationError";
  }
}

export class RateLimitError extends AppError {
  constructor(resetAt: number) {
    super("RATE_LIMIT_EXCEEDED", "Too many requests. Please try again later.", 429, {
      resetAt: new Date(resetAt).toISOString(),
    });
    this.name = "RateLimitError";
  }
}

export class AIServiceError extends AppError {
  constructor(message = "AI service temporarily unavailable") {
    super("AI_SERVICE_ERROR", message, 503);
    this.name = "AIServiceError";
  }
}

/** Type guard — check if value is an AppError. */
export function isAppError(err: unknown): err is AppError {
  return err instanceof AppError;
}
