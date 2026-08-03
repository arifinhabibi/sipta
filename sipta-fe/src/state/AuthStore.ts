// src/state/authStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { authApi } from '../infrastructure/AuthApi';
import { AuthState } from '../domain/UserEntity';
import {setAuthToken } from '../infrastructure/Instance';

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      instance: {
        id: '',
        name: '',
        description: '',
        type_institutions: '',
        latitude: '',
        longitude: '',
        logo: '',
        created_at: '',
        update_at: ''
      },
      academic_year: null,
      isInitialized: false,
      isLoading: false,
      error: null,
      me: null,
      
      // Tambahkan state untuk refresh token
      refreshToken: null,
      tokenExpiry: null,

      updateAccount: async (payload: any) => {
        // Implementation
      },

      updateProfile: async (payload: any) => {
        // Implementation
      },

      updateInstance: async (payload: any) => {
        try {
          const res = await authApi.updateInstance(payload);
          if (res.data.success) {
            await get().getMe();
            return res.data;
          }
        } catch (error: any) {
          throw error;
        }
      },

      updateAcademicYear: (academicYear: any) => {
        set({ academic_year: academicYear });
        // console.log('✅ Academic year updated in auth store:', academicYear);
      },

      changePassword: async(payload: any) => {
        try {
          const res = await authApi.changePassword(payload);
          if (res.data.success) {
            await get().getMe();
            return res.data;
          }
        } catch (error: any) {
          throw error;
        }
      },

      login: async (username, password) => {
        // console.log('🟡 AUTHSTORE LOGIN - START', { username });
        set({ isLoading: true, error: null });
        
        try {
          // console.log('🟡 AUTHSTORE LOGIN - Calling authApi...');
          const res = await authApi.login(username, password);
          // console.log('🟡 AUTHSTORE LOGIN - Response received:', res);
          
          // API umumnya membungkus payload di `data`
          const payload = (res.data as any)?.data ?? res.data;
          const { access_token, refresh_token, expires_in, user, instance, academic_year } = payload ?? {};
          
          // ✅ VALIDASI DATA SEBELUM SET STATE
          if (!access_token || !user) {
            throw new Error("Invalid response from server");
          }
          
          setAuthToken(access_token);
          const tokenExpiry = Date.now() + (expires_in * 1000 || 60 * 60 * 1000);
          
          // ✅ SET SEMUA STATE SEKALIGUS
          set({ 
            token: access_token, 
            refreshToken: refresh_token,
            tokenExpiry: tokenExpiry,
            user: user,        // PASTIKAN user di-set
            instance: instance, 
            academic_year: academic_year,
            isLoading: false,
            isInitialized: true,
            error: null
          });

          // console.log('✅ AUTHSTORE LOGIN - State updated successfully');
          
        } catch (error: any) {
          // console.error('❌ AUTHSTORE LOGIN - Error:', error);
          const errorMessage = error.response?.data?.message || 'Login failed';
          
          // ✅ PASTIKAN STATE DI-RESET SAAT ERROR
          // set({ 
          //   token: null,
          //   refreshToken: null,
          //   tokenExpiry: null,
          //   user: null,        // PASTIKAN user di-set ke null
          //   instance: null,
          //   academic_year: null,
          //   error: errorMessage,
          //   isLoading: false 
          // });
          
          throw error;
        }
      },
      clearAuth: () => {
        setAuthToken(null);
        set({ 
          token: null, 
          refreshToken: null,
          tokenExpiry: null,
          user: null,
          instance: {
              id: '',
              name: '',
              description: '',
              type_institutions: '',
              latitude: '',
              longitude: '',
              logo: '',
              created_at: '',
              update_at: ''
          },
          academic_year: null,
          me: null,
          error: null,
          isInitialized: true // ✅ Tetap set initialized ke true
        });
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          await authApi.logout(get().refreshToken);
        } catch (error) {
          // console.error('Logout API call failed:', error);
        } finally {
          get().clearAuth();
          // ✅ HAPUS DENGAN CARA YANG LEBIH AMAN
          setTimeout(() => {
            localStorage.removeItem('auth-storage');
            localStorage.removeItem('academic-years');
          }, 100);
        }
      },

      refreshAuthToken: async () => {
        const { refreshToken } = get();
        
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        try {
          // console.log('🔄 Refreshing token...');
          const response = await authApi.refreshToken(refreshToken);
          const payload = (response.data as any)?.data ?? response.data;
          const { access_token, refresh_token, expires_in } = payload ?? {};

          if (!access_token) {
            throw new Error('Invalid refresh token response from server');
          }
           
          setAuthToken(access_token);
          const tokenExpiry = Date.now() + (expires_in * 1000 || 60 * 60 * 1000);
          
          set({
            token: access_token,
            refreshToken: refresh_token || refreshToken,
            tokenExpiry: tokenExpiry,
            error: null
          });

          // console.log('✅ Token refreshed successfully');
          return access_token;
        } catch (error: any) {
          // console.error('❌ Token refresh failed:', error);
          await get().logout();
          throw error;
        }
      },

      checkTokenValidity: async () => {
        const { token, tokenExpiry, refreshToken } = get();
        
        if (!token) {
          // console.log('❌ No token available');
          return false;
        }

        // ✅ CEK FORMAT TOKEN DULU
        if (typeof token !== 'string' || token.length < 10) {
          // console.log('❌ Invalid token format');
          return false;
        }

        const isExpired = tokenExpiry && tokenExpiry <= Date.now();
        const willExpireSoon = tokenExpiry && (tokenExpiry - Date.now() < 5 * 60 * 1000);

        if (!isExpired && !willExpireSoon) {
          return true;
        }

        if ((isExpired || willExpireSoon) && refreshToken) {
          try {
            // console.log('🔄 Token needs refresh, attempting...');
            await get().refreshAuthToken();
            return true;
          } catch (error) {
            // console.error('❌ Token refresh failed');
            return false;
          }
        }

        if (isExpired && !refreshToken) {
          // console.log('🚫 Token expired with no refresh token');
          await get().logout();
          return false;
        }

        return !isExpired;
      },
      initializeAuth: async () => {
        // console.log('🔄 initializeAuth called...');
        
        try {
          // ✅ CEK JIKA SUDAH INITIALIZED, HINDARI DOUBLE CALL
          if (get().isInitialized) {
            // console.log('✅ Auth already initialized');
            return;
          }

          const storedAuth = localStorage.getItem('auth-storage');
          if (!storedAuth) {
            // console.log('❌ No auth data in localStorage');
            set({ isInitialized: true });
            return;
          }

          const parsed = JSON.parse(storedAuth);
          const { token, refreshToken, tokenExpiry, user, instance, academic_year } = parsed.state || {};

          // console.log('📦 Retrieved from storage:', { 
          //   hasToken: !!token,
          //   tokenLength: token?.length,
          //   hasUser: !!user 
          // });

          if (token && typeof token === 'string' && token.length > 10) {
            // console.log('✅ Valid token found, initializing auth...');
            
            // ✅ SET TOKEN KE API CLIENT DULU
            setAuthToken(token);
            
            // ✅ SET STATE SEKALIGUS
            set({ 
              token,
              refreshToken: refreshToken || null,
              tokenExpiry: tokenExpiry || null,
              user: user || null,
              instance: instance || null,
              academic_year: academic_year || null,
              isInitialized: true,
              isLoading: false
            });

            // console.log('✅ Auth initialized with token');

            // ✅ CHECK TOKEN VALIDITY SETELAH INIT
            setTimeout(async () => {
              try {
                const isValid = await get().checkTokenValidity();
                // console.log('🔍 Token validity after init:', isValid);
              } catch (error) {
                // console.error('❌ Token validation failed:', error);
              }
            }, 100);

          } else {
            // console.log('❌ Invalid or missing token in storage');
            set({ 
              isInitialized: true,
              token: null,
              user: null 
            });
          }
        } catch (error) {
          console.error('❌ Error in initializeAuth:', error);
          set({ 
            isInitialized: true, // ✅ PASTIKAN SELALU SET INITIALIZED
            token: null,
            user: null 
          });
        }
      },

      clearError: () => {
        set({ error: null });
      },

      checkAuth: async () => {
        const { token } = get();
        if (!token) {
          set({ isInitialized: true });
          return;
        }

        try {
          set({ isLoading: true });
          const isValid = await get().checkTokenValidity();
          if (isValid) {
            await get().getMe();
          }
          set({ isLoading: false });
        } catch (error) {
          // console.error('❌ Auth check failed:', error);
          set({ isLoading: false });
        }
      },

      getMe: async () => {
        const { token } = get();
        if (!token) {
          // console.log('❌ No token available for getMe');
          return;
        }

        // ✅ PASTIKAN TOKEN SUDAH DISET SEBELUM API CALL
        setAuthToken(token);

        set({ isLoading: true, error: null });
        try {
          // console.log('🔄 Fetching profile data...');
          const response = await authApi.getMe();
          
          set({ 
            me: response.data.data,
            isLoading: false,
            error: null
          });
        } catch (error: any) {
          // console.error('❌ Error fetching profile data:', error);
          
          if (error.response?.status === 401) {
            try {
              // console.log('🔄 Token expired, attempting refresh...');
              await get().refreshAuthToken();
              await get().getMe();
              return;
            } catch (refreshError) {
              // console.error('❌ Refresh token failed, logging out...');
              await get().logout();
              return;
            }
          }

          const errorMessage = error.response?.data?.message || 'Failed to fetch profile data';
          set({ 
            error: errorMessage,
            isLoading: false
          });
          
          throw error;
        }
      }
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ 
        token: state.token, 
        refreshToken: state.refreshToken,
        tokenExpiry: state.tokenExpiry,
        user: state.user,
        instance: state.instance,
        academic_year: state.academic_year
      }),
      version: 2,
      migrate: (persistedState: any, version: number) => {
        if (version === 0 || version === 1) {
          return {
            ...persistedState,
            refreshToken: null,
            tokenExpiry: null
          };
        }
        return persistedState;
      },
      onRehydrateStorage: () => (state) => {
        if (state) {
          // console.log('🔄 Storage rehydrated:', state.token ? 'Token exists' : 'No token');
          state.isInitialized = true;
          
          // ✅ SET TOKEN KE API CLIENT SETELAH REHYDRATE
          if (state.token) {
            setAuthToken(state.token);
          }
        }
      }
    }
  )
);
