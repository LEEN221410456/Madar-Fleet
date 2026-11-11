import { useEffect, useRef } from "react";

export default function Modal({
  children,
  onClose,
  labelledBy,
  className = "",
}) {
  const ref = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusable = () =>
      [
        ...ref.current.querySelectorAll(
          'button, input, select, textarea, a[href], [tabindex="0"]',
        ),
      ].filter((el) => !el.disabled && !el.hidden);
    (
      ref.current.querySelector("[data-autofocus]") ||
      focusable()[0] ||
      ref.current
    ).focus();
    const handleKey = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
      if (e.key === "Tab") {
        const nodes = focusable();
        const first = nodes[0],
          last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    const node = ref.current;
    node.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      node.removeEventListener("keydown", handleKey);
      previous?.focus();
    };
  }, [onClose]);
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className={`modal ${className}`}
        ref={ref}
        tabIndex={-1}
      >
        {children}
      </section>
    </div>
  );
}
