export type ApiSuccess<T> = { data: T };
export type ApiError = { error: { message: string } };
export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export function apiSuccess<T>(data: T, status = 200): Response {
    return Response.json({ data } satisfies ApiSuccess<T>, { status });
}

export function apiError(message: string, status = 500): Response {
    return Response.json({ error: { message } } satisfies ApiError, { status });
}
