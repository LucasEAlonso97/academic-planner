import { useState } from "react";

import ConfirmDialog from "./ConfirmDialog";

type ShareProgressCardProps = {
  /** Arma el link con el progreso actual codificado. */
  buildLink: () => string;
};

type ShareState = { link: string; qr: string | null; copied: boolean };

export default function ShareProgressCard({ buildLink }: ShareProgressCardProps) {
  const [share, setShare] = useState<ShareState | null>(null);
  const [error, setError] = useState<string | null>(null);

  const open = async () => {
    const link = buildLink();

    setError(null);
    setShare({ link, qr: null, copied: false });

    try {
      // La librería del QR se carga recién acá.
      const { toDataURL } = await import("qrcode");
      const qr = await toDataURL(link, { margin: 1, width: 496, errorCorrectionLevel: "M" });

      setShare((current) => (current?.link === link ? { ...current, qr } : current));
    } catch {
      setError("No se pudo generar el QR. Podés copiar el link igual.");
    }
  };

  const copy = async () => {
    if (!share) return;

    try {
      await navigator.clipboard.writeText(share.link);
      setShare({ ...share, copied: true });
    } catch {
      setError("No se pudo copiar. Seleccioná el link y copialo a mano.");
    }
  };

  return (
    <>
      <section className="flex flex-col gap-4 rounded-2xl border border-zinc-200/80 bg-white p-5">
        <div>
          <h3 className="text-base font-bold text-zinc-900">Pasar a otro dispositivo</h3>
          <p className="mt-1 text-sm leading-6 text-zinc-600">
            Escaneá un QR desde el celular (o abrí el link) y tu progreso, notas y plan se copian
            ahí. No se guarda nada en ningún servidor.
          </p>
        </div>

        <button
          type="button"
          onClick={open}
          className="mt-auto h-11 self-start rounded-xl border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50"
        >
          Mostrar QR
        </button>
      </section>

      <ConfirmDialog
        isOpen={share !== null}
        title="Escaneá este QR desde el otro dispositivo"
        description={
          share ? (
            <div className="flex flex-col items-center gap-3">
              <div className="flex h-[264px] w-[264px] items-center justify-center rounded-xl border border-zinc-200 bg-white p-2">
                {share.qr ? (
                  <img src={share.qr} alt="Código QR con tu progreso" width={248} height={248} />
                ) : (
                  <span className="text-sm text-zinc-500">{error ? "Sin QR" : "Generando…"}</span>
                )}
              </div>

              <label className="w-full">
                <span className="text-xs font-medium text-zinc-600">O copiá el link</span>
                <input
                  readOnly
                  value={share.link}
                  onFocus={(event) => event.currentTarget.select()}
                  className="mt-1 h-10 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 text-xs text-zinc-700"
                />
              </label>

              {error && <p className="w-full text-sm font-medium text-red-700">{error}</p>}

              <p className="w-full text-xs leading-5 text-zinc-500">
                Quien abra el link ve tu progreso, así que compartilo solo con vos. Al abrirlo te
                vamos a pedir confirmación antes de reemplazar lo que haya en ese dispositivo.
              </p>
            </div>
          ) : null
        }
        confirmLabel={share?.copied ? "¡Copiado!" : "Copiar link"}
        cancelLabel="Cerrar"
        onConfirm={copy}
        onCancel={() => setShare(null)}
      />
    </>
  );
}
