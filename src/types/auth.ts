/**
 * Authentication-related types
 */

export interface PublicUser {
  id: string;
  username: string;
}

export interface LoginPayload {
  username: string;
  password: string;
}

export interface RegisterPayload {
  username: string;
  password: string;
}
