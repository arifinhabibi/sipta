import { AcademicYear } from "../domain/AcademicYearEntity";
import { Instance } from "../domain/UserEntity";

// app/utils/auth/localStorageAuth.ts
export interface User {
  fullname: string;
  degree: string;
  username: string;
  role: 'admin' | 'teacher';
  photo: string;
}

export interface AuthState {
  token: string;
  refreshToken: string | null;
  tokenExpiry: number;
  user: User;
  instance: Instance;
  academic_year: AcademicYear;
}

export interface LocalStorageStructure {
  state: AuthState;
  version?: number;
}


export const getAuthFromLocalStorage = (): AuthState | null => {
  if (typeof window === 'undefined') return null;
  
  const authData = localStorage.getItem('auth-storage');
  if (!authData) return null;
  
  try {
    const parsed = JSON.parse(authData);
    return parsed.state;
  } catch (error) {
    console.error('Error parsing auth data from localStorage:', error);
    return null;
  }
};

export const getUserFromLocalStorage = (): User | null => {
  const authState = getAuthFromLocalStorage();
  return authState?.user || null;
};

export const getTokenFromLocalStorage = (): string | null => {
  const authState = getAuthFromLocalStorage();
  return authState?.token || null;
};

export const isAuthenticated = (): boolean => {
  const authState = getAuthFromLocalStorage();
  if (!authState) return false;
  
  // Check if token exists and is not expired
  const token = authState.token;
  const expiry = authState.tokenExpiry;
  
  if (!token) return false;
  
  // Check if token is expired
  if (expiry && Date.now() > expiry) {
    // Token expired, clear storage
    localStorage.removeItem('auth-storage');
    return false;
  }
  
  return true;
};

export const updateAcademicYearInLocalStorage = (academicYear: AcademicYear): boolean => {
    // console.log("Updating academic year in localStorage:", academicYear);
  try {
    if (typeof window === 'undefined') return false;
    
    // Get current data
    const existingData = localStorage.getItem('auth-storage');
    if (!existingData) {
      console.warn('No auth data found in localStorage');
      return false;
    }
    
    // Parse current data
    const parsed = JSON.parse(existingData);
    
    // Update academic year
    parsed.state.academic_year = academicYear;
    
    // Remove old data and set new data
    localStorage.removeItem('auth-storage');
    localStorage.setItem('auth-storage', JSON.stringify(parsed));
    
    // Dispatch event
    window.dispatchEvent(new Event('academicYearUpdated'));
    
    return true;
  } catch (error) {
    console.error('Error updating academic year in localStorage:', error);
    return false;
  }
};