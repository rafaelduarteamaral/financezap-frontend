import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';

interface CurrencyInputCustomProps {
  value?: number;
  onChange?: (value: number) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  id?: string;
  name?: string;
}

export interface CurrencyInputCustomRef {
  focus: () => void;
}

export const CurrencyInputCustom = forwardRef<CurrencyInputCustomRef, CurrencyInputCustomProps>(
  ({ value = 0, onChange, onFocus, onBlur, placeholder = "R$ 0,00", required, className, id, name }, ref) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [displayValue, setDisplayValue] = useState('');
    const [isFocused, setIsFocused] = useState(false);

    // Converte número para string formatada (ex: 123.45 → "123,45")
    const formatarNumero = (num: number): string => {
      if (num === 0) return '';
      return num.toFixed(2).replace('.', ',');
    };

    // Converte string formatada para número (ex: "123,45" → 123.45)
    const parsearNumero = (str: string): number => {
      const limpo = str.replace(/[^\d,]/g, '').replace(',', '.');
      const num = parseFloat(limpo);
      return isNaN(num) ? 0 : num;
    };

    // Inicializa o displayValue quando o value muda (mas não quando está focado)
    useEffect(() => {
      if (!isFocused) {
        if (value === 0) {
          setDisplayValue('');
        } else {
          setDisplayValue(formatarNumero(value));
        }
      }
    }, [value, isFocused]);

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      
      // Se o valor for 0, limpa o campo completamente para permitir digitação começando pelos centavos
      if (value === 0) {
        setDisplayValue('');
        // Posiciona o cursor no início após um pequeno delay para garantir que o campo foi limpo
        setTimeout(() => {
          e.target.setSelectionRange(0, 0);
        }, 10);
      } else {
        // Se já tem valor, mostra o valor formatado
        const valorFormatado = formatarNumero(value);
        setDisplayValue(valorFormatado);
        // Posiciona o cursor no final para permitir edição
        setTimeout(() => {
          const valorCompleto = `R$ ${valorFormatado}`;
          e.target.setSelectionRange(valorCompleto.length, valorCompleto.length);
        }, 10);
      }
      
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      
      // Garante que o valor está salvo
      const valorAtual = parsearNumero(displayValue);
      if (onChange) {
        onChange(valorAtual);
      }
      
      // Atualiza o display para mostrar o valor formatado
      if (valorAtual === 0) {
        setDisplayValue('');
      } else {
        setDisplayValue(formatarNumero(valorAtual));
      }
      
      onBlur?.(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      
      // Remove o prefixo "R$ " se houver
      const semPrefix = inputValue.replace(/R\$\s*/g, '');
      
      // Remove tudo exceto números e vírgula
      const apenasNumeros = semPrefix.replace(/[^\d,]/g, '');
      
      // Se está vazio, permite digitação começando pelos centavos
      if (apenasNumeros === '') {
        setDisplayValue('');
        onChange?.(0);
        return;
      }

      // Remove vírgulas para processar como centavos
      const apenasDigitos = apenasNumeros.replace(/,/g, '');
      
      // Se não tem dígitos, limpa
      if (apenasDigitos === '') {
        setDisplayValue('');
        onChange?.(0);
        return;
      }

      // Converte para número tratando como centavos
      // Exemplo: "1" → 0.01, "12" → 0.12, "123" → 1.23, "1234" → 12.34
      const valorEmCentavos = parseInt(apenasDigitos, 10);
      const valorEmReais = valorEmCentavos / 100;

      // Formata para exibição: sempre mostra 2 casas decimais
      const partes = valorEmReais.toFixed(2).split('.');
      const parteInteira = partes[0];
      const parteDecimal = partes[1];
      
      // Formata a parte inteira com separador de milhar
      const parteInteiraFormatada = parteInteira.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      
      // Monta o valor formatado: "1.234,56"
      const valorFormatado = `${parteInteiraFormatada},${parteDecimal}`;
      
      setDisplayValue(valorFormatado);
      onChange?.(valorEmReais);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Permite navegação e edição normal
      if (['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter'].includes(e.key)) {
        return;
      }
      
      // Permite apenas números e vírgula
      if (!/[0-9,]/.test(e.key) && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
      }
    };

    useImperativeHandle(ref, () => ({
      focus: () => {
        inputRef.current?.focus();
      },
    }));

    // Formata o valor para exibição com prefixo R$
    const valorExibicao = displayValue === '' ? '' : `R$ ${displayValue}`;

    return (
      <input
        ref={inputRef}
        id={id}
        name={name}
        type="text"
        inputMode="decimal"
        value={valorExibicao}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        required={required}
        className={className}
      />
    );
  }
);

CurrencyInputCustom.displayName = 'CurrencyInputCustom';

