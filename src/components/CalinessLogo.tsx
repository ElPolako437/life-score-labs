import calinessLogo from "/images/caliness-logo-white.png";
interface CalinessLogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  showText?: boolean;
}
export const CalinessLogo = ({
  size = "lg",
  className = "",
  showText = true
}: CalinessLogoProps) => {
  const sizeMap = {
    sm: "w-12 h-12",
    md: "w-16 h-16",
    lg: "w-20 h-20"
  };
  return <div className={`flex items-center gap-3 ${className}`}>
      <img src={calinessLogo} alt="Caliness" className={`${sizeMap[size]} object-contain`} />
      {showText}
    </div>;
};