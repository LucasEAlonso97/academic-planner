import {
  useEffect,
  useState,
} from "react";

type InstallChoiceResult = {
  outcome: "accepted" | "dismissed";
  platform: string;
};

interface BeforeInstallPromptEvent
  extends Event {
  prompt: () => Promise<void>;

  userChoice: Promise<InstallChoiceResult>;
}

function isIosDevice() {
  return /iphone|ipad|ipod/i.test(
    window.navigator.userAgent
  );
}

function isStandaloneMode() {
  const navigatorWithStandalone =
    window.navigator as Navigator & {
      standalone?: boolean;
    };

  return (
    window.matchMedia(
      "(display-mode: standalone)"
    ).matches ||
    navigatorWithStandalone.standalone === true
  );
}

export default function InstallAppCard() {
  const [
    installPrompt,
    setInstallPrompt,
  ] =
    useState<BeforeInstallPromptEvent | null>(
      null
    );

  const [isInstalled, setIsInstalled] =
    useState(false);

  const [
    showIosInstructions,
    setShowIosInstructions,
  ] = useState(false);

  const isIos = isIosDevice();

  useEffect(() => {
    setIsInstalled(isStandaloneMode());

    const handleBeforeInstallPrompt = (
      event: Event
    ) => {
      event.preventDefault();

      setInstallPrompt(
        event as BeforeInstallPromptEvent
      );
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
      setShowIosInstructions(false);
    };

    window.addEventListener(
      "beforeinstallprompt",
      handleBeforeInstallPrompt
    );

    window.addEventListener(
      "appinstalled",
      handleAppInstalled
    );

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );

      window.removeEventListener(
        "appinstalled",
        handleAppInstalled
      );
    };
  }, []);

  const handleInstall = async () => {
    if (isIos) {
      setShowIosInstructions(true);
      return;
    }

    if (!installPrompt) {
      return;
    }

    await installPrompt.prompt();

    const choice =
      await installPrompt.userChoice;

    if (choice.outcome === "accepted") {
      setIsInstalled(true);
    }

    setInstallPrompt(null);
  };

  if (isInstalled) {
    return (
      <section className="rounded-2xl border border-green-200 bg-green-50 p-5 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-green-100 text-2xl">
            ✓
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-green-700">
              Aplicación instalada
            </p>

            <h2 className="mt-1 text-lg font-black text-green-950">
              El planificador está en tu dispositivo
            </h2>

            <p className="mt-1 text-sm leading-6 text-green-800">
              Podés abrirlo directamente desde
              tu pantalla de inicio.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const canShowInstallButton =
    installPrompt !== null || isIos;

  if (!canShowInstallButton) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-[#7B1730]/20 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#7B1730]/10 text-2xl">
            📱
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#7B1730]">
              Acceso rápido
            </p>

            <h2 className="mt-1 text-lg font-black text-zinc-900">
              Instalá el planificador
            </h2>

            <p className="mt-1 max-w-2xl text-sm leading-6 text-zinc-500">
              Abrilo desde la pantalla de inicio
              como una aplicación, sin tener que
              buscar nuevamente el enlace.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleInstall}
          className="shrink-0 rounded-xl bg-[#7B1730] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#651226]"
        >
          Instalar aplicación
        </button>
      </div>

      {showIosInstructions && (
        <div className="mt-5 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
          <p className="font-black text-zinc-900">
            Instalación en iPhone o iPad
          </p>

          <ol className="mt-3 space-y-2 text-sm leading-6 text-zinc-600">
            <li>
              1. Abrí esta página desde Safari.
            </li>

            <li>
              2. Tocá el botón Compartir.
            </li>

            <li>
              3. Elegí “Añadir a pantalla de inicio”.
            </li>

            <li>
              4. Confirmá tocando “Añadir”.
            </li>
          </ol>

          <button
            type="button"
            onClick={() =>
              setShowIosInstructions(false)
            }
            className="mt-4 text-sm font-bold text-[#7B1730]"
          >
            Cerrar instrucciones
          </button>
        </div>
      )}
    </section>
  );
}