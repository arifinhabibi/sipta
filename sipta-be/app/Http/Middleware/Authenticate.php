<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Auth\Middleware\Authenticate as Middleware;
use Illuminate\Support\Facades\Auth;
use Laravel\Sanctum\PersonalAccessToken;
use Response;

class Authenticate extends Middleware
{
    protected function redirectTo($request)
    {
        return null;
    }

    public function handle($request, Closure $next, ...$guards)
    {
        // Cek header Authorization
        $authHeader = $request->header('Authorization');

        if (!$authHeader || !preg_match('/^Bearer\s+(\S+)$/', $authHeader, $matches)) {
            return Response::unauthorized('Missing or invalid Authorization header');
        }

        $token = $matches[1];

        // 1️⃣ Token cocok dengan .env API_TOKEN (akses sistem internal)
        if ($token === config('app.api_token')) {
            return $next($request);
        }

        // 2️⃣ Cek token Sanctum secara manual
        $accessToken = PersonalAccessToken::findToken($token);

        if ($accessToken && $accessToken->tokenable) {
            $user = $accessToken->tokenable;
            $user->withAccessToken($accessToken); // supaya currentAccessToken() berfungsi
            Auth::setUser($user);

            return $next($request);
        }

        // 3️⃣ Kalau dua-duanya gagal
        return Response::unauthorized('Invalid or expired token');
    }
}
