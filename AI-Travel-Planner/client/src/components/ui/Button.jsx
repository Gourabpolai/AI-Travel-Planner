function Button({
  children,
  type = "button",
  className = "",
  ...props
}) {
  return (
    <button
      type={type}
      className={`w-full rounded-lg bg-cyan-600 px-4 py-3 text-white font-semibold transition hover:bg-cyan-700 active:scale-95 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;