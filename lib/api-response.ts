import { NextResponse } from "next/server";
import type { ApiResponse, ApiError } from "@/types";
import { isAppError } from "./errors";
import { generateRequestId } from "./utils";
import { logger } from "./logger";

export function successResponse<T>(
  data: T,
  tenantId: string,
  status: number = 200,
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      meta: {
        requestId: generateRequestId(),
        tenantId,
        timestamp: new Date().toISOString(),
      },
    },
    { status },
  );
}

export function errorResponse(
  err: unknown,
  tenantId: string = "unknown",
): NextResponse<ApiResponse<never>> {
  let apiError: ApiError;
  let status = 500;

  if (isAppError(err)) {
    apiError = {
      code: err.code,
      message: err.message,
      details: err.details,
    };
    status = err.statusCode;
  } else {
    logger.error("Unhandled error", {
      error: err instanceof Error ? err.message : String(err),
    });
    apiError = {
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected error occurred",
    };
  }

  return NextResponse.json(
    {
      success: false,
      error: apiError,
      meta: {
        requestId: generateRequestId(),
        tenantId,
        timestamp: new Date().toISOString(),
      },
    },
    { status },
  );
}
