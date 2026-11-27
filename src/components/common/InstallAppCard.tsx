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
    useState(isStandaloneMode);

  const [
    showIosInstructions,
    setShowIosInstructions,
  ] = useState(false);

  const isIos = isIosDevice();

  useEffect(() => {
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
    return null;
  }

  const canShowInstallButton =
    installPrompt !== null || isIos;

  if (!canShowInstallButton) {
    return null;
  }

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-zinc-200/80 bg-white p-5">
      <div>
        <h3 className="text-base font-bold text-zinc-900">
          Instalá la app
        </h3>

        <p className="mt-1 text-sm leading-6 text-zinc-600">
          Abrila desde la pantalla de inicio como cualquier
          aplicación, incluso sin conexión.
        </p>
      </div>

      {showIosInstructions ? (
        <div className="rounded-xl bg-zinc-50 p-4">
          <p className="text-sm font-semibold text-zinc-900">
            En iPhone o iPad
          </p>

          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm leading-6 text-zinc-700">
            <li>Abrí esta página en Safari.</li>
            <li>Tocá el botón Compartir.</li>
            <li>Elegí “Agregar a inicio”.</li>
            <li>Confirmá con “Agregar”.</li>
          </ol>

          <button
            type="button"
            onClick={() => setShowIosInstructions(false)}
            className="mt-2 h-11 text-sm font-semibold text-[#7B1730]"
          >
            Cerrar instrucciones
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleInstall}
          className="mt-auto h-11 self-start rounded-xl border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50"
        >
          Instalar aplicación
        </button>
      )}
    </section>
  );
}
