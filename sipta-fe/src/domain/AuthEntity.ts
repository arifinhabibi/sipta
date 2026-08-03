export interface AuthUser {
  fullname: string;
  degree: string;
  email: string;
  role: "admin" | "teacher" | "student";
  photo: string;
}

export interface AuthState {
  state: {
    token: string;
    user: AuthUser;
  };
}