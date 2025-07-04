import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authAPI, handleAPIError } from '../services/api';

// Initial state
const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

// Action types
const actionTypes = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  REGISTER_START: 'REGISTER_START',
  REGISTER_SUCCESS: 'REGISTER_SUCCESS',
  REGISTER_FAILURE: 'REGISTER_FAILURE',
  SET_LOADING: 'SET_LOADING',
  CLEAR_ERROR: 'CLEAR_ERROR',
  UPDATE_USER: 'UPDATE_USER',
};

// Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case actionTypes.LOGIN_START:
    case actionTypes.REGISTER_START:
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case actionTypes.LOGIN_SUCCESS:
    case actionTypes.REGISTER_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };

    case actionTypes.LOGIN_FAILURE:
    case actionTypes.REGISTER_FAILURE:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };

    case actionTypes.LOGOUT:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };

    case actionTypes.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
      };

    case actionTypes.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };

    case actionTypes.UPDATE_USER:
      return {
        ...state,
        user: { ...state.user, ...action.payload },
      };

    default:
      return state;
  }
};

// Create context
const AuthContext = createContext();

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Load user from localStorage on app start
  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');

        if (token && savedUser) {
          // Verify token is still valid
          const response = await authAPI.getMe();
          
          dispatch({
            type: actionTypes.LOGIN_SUCCESS,
            payload: {
              user: response.data.user,
              token,
            },
          });
        } else {
          dispatch({ type: actionTypes.SET_LOADING, payload: false });
        }
      } catch (error) {
        // Clear invalid data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        dispatch({ type: actionTypes.SET_LOADING, payload: false });
      }
    };

    loadUser();
  }, []);

  // Login function
  const login = async (credentials) => {
    dispatch({ type: actionTypes.LOGIN_START });

    try {
      const response = await authAPI.login(credentials);
      
      const { token, user } = response.data;

      // Save to localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      dispatch({
        type: actionTypes.LOGIN_SUCCESS,
        payload: { user, token },
      });

      return { success: true, user };
    } catch (error) {
      const errorMessage = handleAPIError(error);
      dispatch({
        type: actionTypes.LOGIN_FAILURE,
        payload: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  };

  // Register function
  const register = async (userData) => {
    dispatch({ type: actionTypes.REGISTER_START });

    try {
      const response = await authAPI.register(userData);
      
      const { token, user } = response.data;

      // Save to localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      dispatch({
        type: actionTypes.REGISTER_SUCCESS,
        payload: { user, token },
      });

      return { success: true, user };
    } catch (error) {
      const errorMessage = handleAPIError(error);
      dispatch({
        type: actionTypes.REGISTER_FAILURE,
        payload: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      // Set loading state to prevent flickering
      dispatch({ type: actionTypes.SET_LOADING, payload: true });
      
      await authAPI.logout();
    } catch (error) {
      // Continue with logout even if API call fails
    } finally {
      // Clear localStorage and state
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      dispatch({ type: actionTypes.LOGOUT });
    }
  };

  // Update user function
  const updateUser = (userData) => {
    const updatedUser = { ...state.user, ...userData };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    dispatch({
      type: actionTypes.UPDATE_USER,
      payload: userData,
    });
  };

  // Clear error function
  const clearError = () => {
    dispatch({ type: actionTypes.CLEAR_ERROR });
  };

  // Refresh token function
  const refreshToken = async () => {
    try {
      const response = await authAPI.refreshToken();
      const { token } = response.data;
      
      localStorage.setItem('token', token);
      return token;
    } catch (error) {
      logout();
      throw error;
    }
  };

  const value = {
    ...state,
    login,
    register,
    logout,
    updateUser,
    clearError,
    refreshToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// HOC for protected routes
export const withAuth = (Component) => {
  return (props) => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-brand-500)] mx-auto mb-4"></div>
            <p className="text-[var(--color-text-secondary)]">Loading...</p>
          </div>
        </div>
      );
    }

    if (!isAuthenticated) {
      window.location.href = '/login';
      return null;
    }

    return <Component {...props} />;
  };
};
