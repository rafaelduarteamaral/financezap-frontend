
interface AvatarProps {
  nome?: string;
  telefone?: string;
  foto?: string;
  size?: number;
  className?: string;
}

export function Avatar({ nome, telefone, foto, size = 40, className = '' }: AvatarProps) {
  // Se tiver foto, mostra a foto
  if (foto) {
    return (
      <img
        src={foto}
        alt={nome || telefone || 'Usuário'}
        className={`rounded-full object-cover ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  // Se não tiver foto, pega a primeira letra do nome ou telefone
  const inicial = nome
    ? nome.trim().charAt(0).toUpperCase()
    : telefone
    ? telefone.replace(/\D/g, '').charAt(0) || '?'
    : '?';

  // Cores baseadas na inicial (para consistência visual)
  const cores = [
    'bg-blue-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-red-500',
    'bg-orange-500',
    'bg-yellow-500',
    'bg-green-500',
    'bg-teal-500',
    'bg-cyan-500',
    'bg-indigo-500',
  ];
  
  const indiceCor = inicial.charCodeAt(0) % cores.length;
  const corBg = cores[indiceCor];

  return (
    <div
      className={`${corBg} text-white rounded-full flex items-center justify-center font-semibold shadow-md ${className}`}
      style={{ 
        width: size, 
        height: size,
        fontSize: size * 0.4,
      }}
    >
      {inicial}
    </div>
  );
}

