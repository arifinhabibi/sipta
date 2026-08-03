<?php

namespace App\Lib;

use Illuminate\Http\JsonResponse;

class ResponseHelper
{
    public static function success($message = 'Success', $statusCode = 200, $data = null): JsonResponse
    {
        $response = [
            'success' => true,
            'message' => $message,
        ];

        if (!is_null($data)) {
            $response['data'] = $data;
        }

        return response()->json($response, $statusCode);
    }

    public static function error($message = 'Error', $statusCode = 400, $errors = null): JsonResponse
    {
        $response = [
            'success' => false,
            'message' => $message,
        ];

        if (!is_null($errors)) {
            $response['errors'] = $errors;
        }

        return response()->json($response, $statusCode);
    }

    // === Shortcut methods ===
    public static function badRequest($message = 'Bad Request', $errors = null): JsonResponse
    {
        return self::error($message, 400, $errors);
    }

    public static function unauthorized($message = 'Unauthorized'): JsonResponse
    {
        return self::error($message, 401);
    }

    public static function forbidden($message = 'Forbidden'): JsonResponse
    {
        return self::error($message, 403);
    }

    public static function notFound($message = 'Resource not found'): JsonResponse
    {
        return self::error($message, 404);
    }

    public static function conflict($message = 'Conflict detected', $errors = null): JsonResponse
    {
        return self::error($message, 409, $errors);
    }

    public static function unprocessable($message = 'Unprocessable Entity', $errors = null): JsonResponse
    {
        return self::error($message, 422, $errors);
    }

    public static function serverError($message = 'Internal Server Error', $errors = null): JsonResponse
    {
        return self::error($message, 500, $errors);
    }
}
