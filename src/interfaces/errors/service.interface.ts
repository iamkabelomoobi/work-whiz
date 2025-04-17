export interface IServiceErrorDetails {
  message: string;
  code?: string;
  trace?: {
    method?: string;
    file?: string;
    stack?: string;
    context?: Record<string, unknown>;
  };
  originalError?: unknown;
}
