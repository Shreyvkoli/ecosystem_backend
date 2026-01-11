import Cookies from 'js-cookie';
import { User } from './api';

export const setAuthToken = (token: string) => {
  Cookies.set('token', token, { expires: 7 });
};

export const removeAuthToken = () => {
  Cookies.remove('token');
};

export const getAuthToken = () => {
  return Cookies.get('token');
};

export const setUser = (user: User) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('user', JSON.stringify(user));
  }
};

export const getUser = (): User | null => {
  if (typeof window !== 'undefined') {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }
  return null;
};

export const removeUser = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('user');
  }
};

