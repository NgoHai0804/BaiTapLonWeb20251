import { toast as toastify } from 'react-toastify';
import { FaCheckCircle, FaExclamationTriangle, FaInfoCircle, FaTimes } from 'react-icons/fa';
import soundManager from './soundManager';
import './toast.css';

/**
 * Enhanced Toast Notifications
 * Wrapper around react-toastify with custom styling and sounds
 */

const defaultOptions = {
    position: 'top-right',
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
};

/**
 * Custom toast content component
 */
const ToastContent = ({ icon, title, message }) => (
    <div className="custom-toast-content">
        <div className="toast-icon">{icon}</div>
        <div className="toast-text">
            {title && <div className="toast-title">{title}</div>}
            <div className="toast-message">{message}</div>
        </div>
    </div>
);

/**
 * Success toast
 */
export const success = (message, title = null, options = {}) => {
    soundManager.play('success');

    return toastify.success(
        <ToastContent
            icon={<FaCheckCircle />}
            title={title}
            message={message}
        />,
        {
            ...defaultOptions,
            ...options,
            className: 'toast-success'
        }
    );
};

/**
 * Error toast
 */
export const error = (message, title = 'Lỗi', options = {}) => {
    soundManager.play('error');

    return toastify.error(
        <ToastContent
            icon={<FaTimes />}
            title={title}
            message={message}
        />,
        {
            ...defaultOptions,
            autoClose: 5000, // Longer for errors
            ...options,
            className: 'toast-error'
        }
    );
};

/**
 * Warning toast
 */
export const warning = (message, title = 'Cảnh báo', options = {}) => {
    return toastify.warning(
        <ToastContent
            icon={<FaExclamationTriangle />}
            title={title}
            message={message}
        />,
        {
            ...defaultOptions,
            ...options,
            className: 'toast-warning'
        }
    );
};

/**
 * Info toast
 */
export const info = (message, title = null, options = {}) => {
    soundManager.play('notification');

    return toastify.info(
        <ToastContent
            icon={<FaInfoCircle />}
            title={title}
            message={message}
        />,
        {
            ...defaultOptions,
            ...options,
            className: 'toast-info'
        }
    );
};

/**
 * Loading toast (promise)
 */
export const loading = (promise, messages = {}) => {
    const {
        pending = 'Đang xử lý...',
        success = 'Thành công!',
        error = 'Đã có lỗi xảy ra!'
    } = messages;

    return toastify.promise(
        promise,
        {
            pending: {
                render: pending,
                className: 'toast-loading'
            },
            success: {
                render: success,
                className: 'toast-success'
            },
            error: {
                render: error,
                className: 'toast-error'
            }
        },
        defaultOptions
    );
};

/**
 * Dismiss toast
 */
export const dismiss = (toastId) => {
    toastify.dismiss(toastId);
};

/**
 * Dismiss all toasts
 */
export const dismissAll = () => {
    toastify.dismiss();
};

/**
 * Update existing toast
 */
export const update = (toastId, options) => {
    toastify.update(toastId, options);
};

// Export all together
const toast = {
    success,
    error,
    warning,
    info,
    loading,
    dismiss,
    dismissAll,
    update
};

export default toast;
