import axios from "axios";
import { createContext, useEffect, useReducer } from "react";
import { API_BASE_URL } from "../config/api.js";

const Authcontext = createContext();
const getToken = () => localStorage.getItem("token");
const getFileUrl = () => JSON.parse(localStorage.getItem("fileUrl")) || [];
const getActiveEvent = () => JSON.parse(localStorage.getItem("activeEvent")) || {};

const initialState = {
  user: null,
  isAuthenticated: !!getToken(),
  loading: true,
  error: null,
  value: "",
  fileUrl: getFileUrl(),
  activeEvent:getActiveEvent(),
};

function reducer(state, action) {
  switch (action.type) {
    case "login":
      return { ...state, isAuthenticated: true, loading: false, error: null };
    case "logout":
      return { ...state, user: null, isAuthenticated: false, loading: false };
    case "loading":
      return { ...state, loading: action.payload ?? true, error: null };
    case "error":
      return { ...state, loading: false, error: action.payload };
    case "setUser":
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        loading: false,
        error: null,
      };
    case "activeEvent":
      return { ...state, activeEvent: action.payload }; 
    case "fileUrlvalue":
      return { ...state, fileUrl: action.payload };
    default:
      throw new Error("Unknown action type");
  }
}

export default function AuthProvider({ children }) {
  const [{ user, isAuthenticated, loading, error, value, fileUrl,activeEvent }, dispatch] =
    useReducer(reducer, initialState);

  const fetchUserProfile = async () => {
    try {
      dispatch({ type: "loading" });
      const token = getToken();
      if (!token) throw new Error("No authentication token found");

      const response = await axios.get(`${API_BASE_URL}/api/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Response.data is already the user object
      dispatch({ type: "setUser", payload: response.data });
    } catch (err) {
      dispatch({
        type: "error",
        payload: err.response?.data?.error || "Failed to fetch user profile",
      });
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchUserProfile();
    } else {
      dispatch({ type: "loading", payload: false });
    }
  }, [isAuthenticated]);

  useEffect(() => {
    localStorage.setItem("fileUrl", JSON.stringify(fileUrl));
    localStorage.setItem("activeEvent", JSON.stringify(activeEvent));
  }, [fileUrl,activeEvent]);

  const login = () => dispatch({ type: "login" });
  const logout = () => {
    localStorage.removeItem("token");
    dispatch({ type: "logout" });
  };
  const onEvent = (value) => dispatch({ type: "activeEvent", payload: value });

  // FIXED: Append the new URL string correctly to the array
  const url = (newUrl) => {
    dispatch({ type: "fileUrlvalue", payload: [...fileUrl, newUrl] });
  };

  return (
    <Authcontext.Provider
      value={{
        user,
    isAuthenticated,
    loading,
    error,
    login,
    logout,
    onEvent,
    url,
    fileUrl,
    activeEvent,
      }}
    >
      {children}
    </Authcontext.Provider>
  );
}
export { Authcontext };
