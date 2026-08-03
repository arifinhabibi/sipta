<?php

namespace App\Http\Controllers;

use App\Models\LoginLog;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Str;
use Laravel\Sanctum\PersonalAccessToken;
use Response;

class AuthController extends Controller
{
    public function signIn(Request $request)
    {
        // Batasi percobaan login per IP dan username untuk mencegah brute force
        $this->ensureIsNotRateLimited($request);

        $credentials = $request->validate([
            'username' => 'required|string',
            'password' => 'required|string'
        ]);

        // Ambil user dari database
        $user = User::where('username', $credentials['username'])->first();

        // Cek apakah user ditemukan dan password cocok
        if (!$user) {
            RateLimiter::hit($this->throttleKey($request), 60); // catat percobaan gagal
            return Response::error("Username not found!", 401);
        }

        if (!Hash::check($credentials['password'], $user->password)) {
            RateLimiter::hit($this->throttleKey($request), 60);
            return Response::error("Password not equal!", 401);
        }

        if (!$user->is_active) {
            return Response::error("This account is deactivated.", 403);
        }

        // Reset counter rate limit setelah sukses login
        RateLimiter::clear($this->throttleKey($request));

        // Generate token unik dengan device fingerprint (opsional)
        $device = $request->header('User-Agent', 'unknown-device');
        $tokenName = 'auth_token_' . Str::random(10);

        $token = $user->createToken($tokenName, ['access'])->plainTextToken;
        $refreshToken = $user->createToken(
            'refresh_token_' . Str::random(10),
            ['refresh']
        )->plainTextToken;

        // Simpan log aktivitas login
        LoginLog::create([
            'user_id' => $user->id,
            'ip_address' => $request->ip(),
            'user_agent' => $device,
        ]);

        $user->load('teacher.instance.academicYears');

        // Dapatkan academic year aktif
        $activeAcademicYear = null;
        if ($user->teacher->instance && $user->teacher->instance->academicYears) {
            $activeAcademicYear = $user->teacher->instance->academicYears
                ->where('is_active', 1)
                ->first();
        }

        // Siapkan instance data TANPA academic_years
        $instanceData = null;
        if ($user->teacher->instance) {
            $instanceData = $user->teacher->instance->toArray();
            unset($instanceData['academic_years']); // Hapus academic_years dari instance
        }



        return Response::success("Signed in successfully!", 200, [
            'access_token' => $token,
            'refresh_token' => $refreshToken,
            'token_type' => 'Bearer',
            'expires_in' => 3600,
            'instance' => $instanceData, // Instance tanpa academic_years
            'academic_year' => $activeAcademicYear, // Hanya academic year aktif
            'user' => [
                'fullname' => $user->teacher->full_name,
                'degree' =>  $user->teacher->degree,
                'username' => $user->username,
                'role' => $user->role,
                'photo' => $user->teacher->photo
            ]
        ]);
    }

    protected function ensureIsNotRateLimited(Request $request)
    {
        $key = $this->throttleKey($request);

        if (!RateLimiter::tooManyAttempts($key, 5)) {
            return;
        }

        $seconds = RateLimiter::availableIn($key);

        throw ValidationException::withMessages([
            'username' => "Too many login attempts. Please try again in {$seconds} seconds."
        ]);
    }

    protected function throttleKey(Request $request)
    {
        return Str::lower($request->input('username')) . '|' . $request->ip();
    }

    public function signOut(Request $request)
    {
        $user = $request->user();
        $token = $user->currentAccessToken();

        if (!$token) {
            return Response::error('No active access token found', 400);
        }

        $token->delete();

        $refreshTokenValue = $request->input('refresh_token');
        if ($refreshTokenValue) {
            $refreshToken = PersonalAccessToken::findToken($refreshTokenValue);
            if (
                $refreshToken
                && $refreshToken->tokenable_id === $user->id
                && $refreshToken->can('refresh')
            ) {
                $refreshToken->delete();
            }
        }

        return Response::success("Signed out successfully!");
    }

    public function changePassword(Request $request)
    {
        $user = Auth::user();
        if (!$user) {
            return Response::notFound();
        }

        if (RateLimiter::tooManyAttempts($this->throttleKey($request), 5)) {
            return Response::error('Too many failed attempts. Try again later.', 429);
        }

        $validator = Validator::make($request->all(), [
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:6',
        ]);

        if ($validator->fails()) {
            return Response::badRequest('Bad Request', $validator->errors());
        }

        if (!Hash::check($request->input('current_password'), $user->password)) {
            RateLimiter::hit($this->throttleKey($request), 60);
            return Response::error('Current password not equal!', 401);
        }

        RateLimiter::clear($this->throttleKey($request));

        $user->update([
            'password' => Hash::make($request->input('new_password')),
        ]);

        return Response::success('Password has been updated!');
    }


    public function me()
    {
        $user = Auth::user();

        if (!$user) {
            return Response::notFound();
        }

        $user->load([
            'teacher.instance',
            'teacher.classrooms'
        ]);

        return Response::success("Data has been loaded!", 200, $user);
    }

    public function refreshToken($token)
    {
        return $this->rotateRefreshToken($token);
    }

    public function refresh(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'refresh_token' => 'required|string',
        ]);

        if ($validator->fails()) {
            return Response::badRequest(
                'Refresh token wajib diisi.',
                $validator->errors()
            );
        }

        return $this->rotateRefreshToken($request->input('refresh_token'));
    }

    private function rotateRefreshToken($token)
    {
        try {
            // Cari token berdasarkan refresh token
            $refreshToken = PersonalAccessToken::findToken($token);

            if (!$refreshToken) {
                return Response::error('Invalid refresh token', 401);
            }

            // Cek apakah token memiliki ability 'refresh'
            if (!$refreshToken->can('refresh')) {
                return Response::error('Token cannot be used for refresh', 403);
            }

            $user = $refreshToken->tokenable;

            if (!$user) {
                return Response::error('User not found', 404);
            }

            // Hapus access token lama yang terkait dengan user ini.
            $user->tokens()->where('abilities', '["access"]')->delete();

            // Buat token baru
            $newAccessToken = $user->createToken('auth_token_' . Str::random(10), ['access'])->plainTextToken;
            $newRefreshToken = $user->createToken('refresh_token_' . Str::random(10), ['refresh'])->plainTextToken;

            // Hapus refresh token lama yang digunakan
            $refreshToken->delete();

            return Response::success("Token refreshed successfully!", 200, [
                'access_token' => $newAccessToken,
                'refresh_token' => $newRefreshToken,
                'token_type' => 'Bearer',
                'expires_in' => 3600 // 1 jam dalam detik
            ]);
        } catch (\Exception $e) {
            return Response::serverError('Token refresh failed.');
        }
    }
}
