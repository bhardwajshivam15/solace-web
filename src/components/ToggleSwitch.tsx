interface ToggleSwitchProps {
  checked: boolean;
  onChange: () => void;
  /** "inverted" reads better sitting on a dark/brand-colored background. */
  tone?: "default" | "inverted";
  className?: string;
  "aria-label"?: string;
}

export default function ToggleSwitch({
  checked,
  onChange,
  tone = "default",
  className,
  ...rest
}: ToggleSwitchProps) {
  const track =
    tone === "inverted"
      ? checked
        ? "bg-white"
        : "bg-white/20"
      : checked
        ? "bg-brand-600"
        : "bg-gray-200";
  const knob = tone === "inverted" && checked ? "bg-brand-600" : "bg-white";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${track} ${className ?? ""}`}
      {...rest}
    >
      <span
        className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full shadow transition-transform ${knob} ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}
