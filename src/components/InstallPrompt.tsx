import { useState, useEffect } from 'react';
import { useToast } from '../contexts/ToastContext';
import { FaDownload, FaTimes, FaMobileAlt } from 'react-icons/fa';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
  const { showInfo } = useToast();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    // Detecta o sistema operacional
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    const isAndroidDevice = /android/.test(userAgent);
    
    setIsIOS(isIOSDevice);
    setIsAndroid(isAndroidDevice);

    // Verifica se já está instalado
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isIOSStandalone = (window.navigator as any).standalone === true;
    
    if (isStandalone || isIOSStandalone) {
      setIsInstalled(true);
      return;
    }

    // Em dispositivos móveis, mostra o prompt imediatamente (sem esperar evento)
    if (isIOSDevice || isAndroidDevice) {
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      if (!dismissed) {
        // Mostra após um pequeno delay para não interferir no carregamento
        setTimeout(() => {
          setShowPrompt(true);
        }, 2000);
      }
    }

    // Escuta o evento beforeinstallprompt (Chrome/Edge Android)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Verifica se foi instalado após o prompt
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    });

    // Mostra o prompt manualmente após 3 segundos se não recebeu o evento automático
    // Mas só se não foi dispensado recentemente
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (!dismissed) {
      const timer = setTimeout(() => {
        // Se ainda não recebeu o evento e não está instalado, mostra manualmente
        // Mostra sempre em iOS/Android, mesmo sem o evento
        if (!isInstalled) {
          setShowPrompt(true);
        }
      }, 3000);

      return () => {
        clearTimeout(timer);
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      };
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [isInstalled]);

  const handleInstallClick = async () => {
    // Se tem o evento beforeinstallprompt, usa ele
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
          setIsInstalled(true);
          setShowPrompt(false);
        }

        setDeferredPrompt(null);
      } catch (error) {
        // Erro silencioso
      }
      return;
    }

    // Para iOS, mostra instruções
    if (isIOS) {
      showInfo(
        'Para instalar no iOS:\n\n' +
        '1. Toque no botão "Compartilhar" (ícone de compartilhamento)\n' +
        '2. Role para baixo e toque em "Adicionar à Tela de Início"\n' +
        '3. Toque em "Adicionar"',
        10000
      );
      return;
    }

    // Para Android sem o evento, mostra instruções
    if (isAndroid) {
      showInfo(
        'Para instalar no Android:\n\n' +
        '1. Toque no menu (3 pontos) no canto superior direito\n' +
        '2. Selecione "Adicionar à tela inicial" ou "Instalar app"\n' +
        '3. Confirme a instalação',
        10000
      );
      return;
    }

    // Fallback genérico
    showInfo(
      'Para instalar este app:\n\n' +
      '1. Procure pelo ícone de instalação na barra de endereços\n' +
      '2. Ou use o menu do navegador para "Instalar app"',
      10000
    );
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Salva no localStorage para não mostrar novamente por 7 dias
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  // Não mostra se já está instalado
  if (isInstalled) {
    return null;
  }

  // Verifica se foi dispensado recentemente (7 dias)
  const dismissed = localStorage.getItem('pwa-install-dismissed');
  if (dismissed) {
    const dismissedTime = parseInt(dismissed, 10);
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    if (Date.now() - dismissedTime < sevenDays) {
      return null;
    }
  }

  // Mostra o prompt se showPrompt for true (setado após 3s ou pelo evento)
  // OU se é iOS/Android (sempre mostra para mobile)
  if (!showPrompt && !isIOS && !isAndroid) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-slide-up">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl border-2 border-green-500 p-4 flex items-start gap-3 install-prompt-container">
        <div className="flex-shrink-0 mt-1">
          <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
            <FaDownload className="text-white text-xl" />
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-slate-900 dark:text-white mb-1">
            Instalar Zela
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">
            {isIOS 
              ? 'Adicione à tela inicial para acesso rápido e funcionamento offline.'
              : deferredPrompt
              ? 'Instale o app para acesso rápido e funcionamento offline.'
              : 'Instale o app para uma experiência melhor.'
            }
          </p>
          
          <div className="flex gap-2">
            <button
              onClick={handleInstallClick}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isIOS ? <FaMobileAlt /> : <FaDownload />}
              {isIOS ? 'Como Instalar' : 'Instalar'}
            </button>
            <button
              onClick={handleDismiss}
              className="px-4 py-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors rounded-lg"
              aria-label="Fechar"
            >
              <FaTimes />
            </button>
          </div>
          
          {isIOS && (
            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                <strong>iOS:</strong> Compartilhar → Adicionar à Tela de Início
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

