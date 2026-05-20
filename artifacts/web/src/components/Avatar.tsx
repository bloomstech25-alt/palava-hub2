import { avatarColor, initials } from "@/lib/utils";

type Props = {
  name: string;
  src?: string | null;
  size?: number;
  className?: string;
};

export function Avatar({ name, src, size = 40, className = "" }: Props) {
  const dim = { width: size, height: size, fontSize: Math.max(11, size * 0.42) };
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        style={dim}
        className={`rounded-full object-cover bg-gray-200 ${className}`}
      />
    );
  }
  return (
    <div
      style={{ ...dim, background: avatarColor(name || "?") }}
      className={`rounded-full flex items-center justify-center text-white font-bold select-none ${className}`}
    >
      {initials(name || "?")}
    </div>
  );
}
