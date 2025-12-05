
interface LogoProps {
  size?: number;
  className?: string;
}

export function Logo({ size = 32, className = '' }: LogoProps) {
  return (
    <div 
      className={`inline-flex items-center justify-center flex-shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <div 
        className="relative rounded-lg flex items-center justify-center"
        style={{
          width: size,
          height: size,
          backgroundColor: '#10b981', // Verde vibrante
        }}
      >
        {/* Letra "z" minúscula desenhada com SVG - estilo suave e arredondado */}
        <svg
          width={size * 0.65}
          height={size * 0.65}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Letra "z" com path único contínuo para máxima suavidade */}
          <path
            d="M 5 7.5 L 19 7.5 L 5 16.5 L 19 16.5"
            stroke="white"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      </div>
    </div>
  );
}

