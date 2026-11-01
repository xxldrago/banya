export type ApiError = {
  error: {
    code: string;
    message: string;
  };
};

export type ApiResponse<T> = {
  data: T;
};

export type PaginatedResponse<T> = {
  data: T[];
  meta: {
    total: number;
    limit: number;
    offset: number;
  };
};
