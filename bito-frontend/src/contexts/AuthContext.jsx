import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authAPI, handleAPIError } from '../services/api';
import userPreferencesService from '../services/userPreferencesService';

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
  MAGIC_LINK_REQUEST_START: 'MAGIC_LINK_REQUEST_START',
  MAGIC_LINK_REQUEST_SUCCESS: 'MAGIC_LINK_REQUEST_SUCCESS',
  MAGIC_LINK_REQUEST_FAILURE: 'MAGIC_LINK_REQUEST_FAILURE',
  MAGIC_LINK_VERIFY_START: 'MAGIC_LINK_VERIFY_START',
  MAGIC_LINK_VERIFY_SUCCESS: 'MAGIC_LINK_VERIFY_SUCCESS',
  MAGIC_LINK_VERIFY_FAILURE: 'MAGIC_LINK_VERIFY_FAILURE',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGOUT: 'LOGOUT',
  SET_LOADING: 'SET_LOADING',
  CLEAR_ERROR: 'CLEAR_ERROR',
  UPDATE_USER: 'UPDATE_USER',
};

// Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case actionTypes.MAGIC_LINK_REQUEST_START:
    case actionTypes.MAGIC_LINK_VERIFY_START:
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case actionTypes.MAGIC_LINK_REQUEST_SUCCESS:
      return {
        ...state,
        isLoading: false,
        error: null,
      };

    case actionTypes.LOGIN_SUCCESS:
    case actionTypes.MAGIC_LINK_VERIFY_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };

    case actionTypes.MAGIC_LINK_REQUEST_FAILURE:
    case actionTypes.MAGIC_LINK_VERIFY_FAILURE:
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
          
          // Sync user preferences (weekStartsOn, etc.) to the preferences service
          userPreferencesService.syncWithBackend(response.data.user);

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

  // Request magic link
  const requestMagicLink = async (email) => {
    dispatch({ type: actionTypes.MAGIC_LINK_REQUEST_START });

    try {
      const response = await authAPI.requestMagicLink(email);
      
      dispatch({ type: actionTypes.MAGIC_LINK_REQUEST_SUCCESS });

      return { success: true, message: response.message };
    } catch (error) {
      const errorMessage = handleAPIError(error);
      dispatch({
        type: actionTypes.MAGIC_LINK_REQUEST_FAILURE,
        payload: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  };

  // Verify magic link token
  const verifyMagicLink = async (token) => {
    dispatch({ type: actionTypes.MAGIC_LINK_VERIFY_START });

    try {
      const response = await authAPI.verifyMagicLink(token);
      
      const { token: jwtToken, user, isNewUser } = response.data;

      // Save to localStorage
      localStorage.setItem('token', jwtToken);
      localStorage.setItem('user', JSON.stringify(user));

      // Sync user preferences on login
      userPreferencesService.syncWithBackend(user);

      dispatch({
        type: actionTypes.MAGIC_LINK_VERIFY_SUCCESS,
        payload: { user, token: jwtToken },
      });

      return { success: true, user, isNewUser };
    } catch (error) {
      const errorMessage = handleAPIError(error);
      dispatch({
        type: actionTypes.MAGIC_LINK_VERIFY_FAILURE,
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
    // Keep preferences service in sync
    userPreferencesService.syncWithBackend(updatedUser);
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
    requestMagicLink,
    verifyMagicLink,
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
