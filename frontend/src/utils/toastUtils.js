import { toast } from "react-toastify";

const DEFAULT_TOAST_OPTIONS = {
  position: "top-right",
  autoClose: 4200,
  pauseOnHover: true,
};

const toMessage = (value, fallback) => {
  const message = String(value || "").trim();
  return message || fallback;
};

export const showSuccessToast = (message) =>
  toast.success(toMessage(message, "Done successfully."), DEFAULT_TOAST_OPTIONS);

export const showInfoToast = (message) =>
  toast.info(toMessage(message, "Heads up."), DEFAULT_TOAST_OPTIONS);

export const showWarningToast = (message) =>
  toast.warn(toMessage(message, "Please review your input."), DEFAULT_TOAST_OPTIONS);

export const showApiErrorToast = (error, fallback = "Something went wrong.") => {
  const status = Number(error?.response?.status || 0);
  const serverMessage = toMessage(error?.response?.data?.message, fallback);

  if (status === 409) {
    return toast.error(`Conflict: ${serverMessage}`, DEFAULT_TOAST_OPTIONS);
  }

  if (status >= 500) {
    return toast.error(`Server issue: ${serverMessage}`, DEFAULT_TOAST_OPTIONS);
  }

  if (status === 401 || status === 403) {
    return toast.error(`Access issue: ${serverMessage}`, DEFAULT_TOAST_OPTIONS);
  }

  return toast.error(serverMessage, DEFAULT_TOAST_OPTIONS);
};