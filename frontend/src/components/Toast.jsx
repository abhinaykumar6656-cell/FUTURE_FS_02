const Toast = ({ message, type = 'success', onClose }) => {
  if (!message) return null;

  return (
    <div className={`toast toast-${type}`} role="status">
      <span>{message}</span>
      <button type="button" onClick={onClose} aria-label="Dismiss notification">
        x
      </button>
    </div>
  );
};

export default Toast;
