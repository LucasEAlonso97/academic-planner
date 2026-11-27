import {
  useEffect,
  useState,
  type ReactNode,
} from "react";

type AppLayoutProps = {
  children: ReactNode;
};

type NavigationItem = {
  label: string;
  href: string;
};

type NavigationGroup = {
  title: string;
  items: NavigationItem[];
};

const navigationGroups: NavigationGroup[] = [
  {
    title: "General",
    items: [
      { label: "Inicio", href: "#inicio" },
      { label: "Próximo cuatrimestre", href: "#proximo-cuatrimestre" },
    ],
  },
  {
    title: "Carrera",
    items: [
      { label: "Plan de estudios", href: "#plan-academico" },
      { label: "Planificar", href: "#planificar" },
      { label: "Herramientas", href: "#herramientas" },
    ],
  },
];

const sectionIds = navigationGroups.flatMap(
  (group) =>
    group.items.map((item) =>
      item.href.replace("#", "")
    )
);

export default function AppLayout({
  children,
}: AppLayoutProps) {
  const [
    isMobileMenuOpen,
    setIsMobileMenuOpen,
  ] = useState(false);

  const [activeSection, setActiveSection] =
    useState("inicio");

  useEffect(() => {
    document.body.style.overflow =
      isMobileMenuOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    const handleEscape = (
      event: KeyboardEvent
    ) => {
      if (event.key === "Escape") {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, []);

  useEffect(() => {
    const updateActiveSection = () => {
      const referencePosition =
        window.scrollY + 160;

      let currentSection = "inicio";

      sectionIds.forEach((sectionId) => {
        const section =
          document.getElementById(sectionId);

        if (
          section &&
          section.offsetTop <=
            referencePosition
        ) {
          currentSection = sectionId;
        }
      });

      setActiveSection(currentSection);
    };

    updateActiveSection();

    window.addEventListener(
      "scroll",
      updateActiveSection,
      {
        passive: true,
      }
    );

    return () => {
      window.removeEventListener(
        "scroll",
        updateActiveSection
      );
    };
  }, []);

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const handleNavigationClick = (
    href: string,
    mobile: boolean
  ) => {
    setActiveSection(
      href.replace("#", "")
    );

    if (mobile) {
      closeMobileMenu();
    }
  };

  const renderNavigation = (
    mobile = false
  ) => (
    <div className="space-y-7">
      {navigationGroups.map((group) => (
        <section key={group.title}>
          <p className="mb-2 px-4 text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
            {group.title}
          </p>

          <div className="space-y-1">
            {group.items.map((item) => {
              const sectionId =
                item.href.replace("#", "");

              const isActive =
                activeSection === sectionId;

              return (
                <a
                  key={item.href}
                  href={item.href}
                  aria-current={
                    isActive
                      ? "page"
                      : undefined
                  }
                  onClick={() =>
                    handleNavigationClick(
                      item.href,
                      mobile
                    )
                  }
                  className={`relative flex min-h-11 items-center rounded-lg px-4 py-2.5 text-sm font-bold transition ${
                    isActive
                      ? "bg-white/10 text-white"
                      : "text-white/65 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {isActive && (
                    <span
                      aria-hidden="true"
                      className="absolute bottom-2.5 left-0 top-2.5 w-1 rounded-r-full bg-white"
                    />
                  )}

                  <span
                    className={
                      isActive
                        ? "translate-x-1"
                        : ""
                    }
                  >
                    {item.label}
                  </span>
                </a>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Navegación de escritorio */}
      <aside
        className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col overflow-y-auto bg-[#7B1730] text-white shadow-xl lg:flex [&::-webkit-scrollbar]:hidden"
        style={{
          scrollbarWidth: "none",
        }}
      >
        <div className="px-6 pb-6 pt-8">
          <img
            src="/pwa-192x192.png"
            alt=""
            width={44}
            height={44}
            className="h-11 w-11 rounded-xl ring-1 ring-white/20"
          />

          <p className="mt-5 text-xl font-black">
            UAI Planner
          </p>

          <p className="mt-1 text-sm leading-5 text-white/55">
            Tu trayectoria académica,
            organizada.
          </p>
        </div>

        <div className="mx-5 border-t border-white/10" />

        <nav
          aria-label="Navegación principal"
          className="flex-1 px-4 py-6"
        >
          {renderNavigation()}
        </nav>

        <div className="mx-5 border-t border-white/10" />

        <div className="px-6 py-5">
          <p className="text-[11px] leading-5 text-white/40">
            Herramienta independiente.
            Verificá la información en los
            canales oficiales de la UAI.
          </p>
        </div>
      </aside>

      {/* Encabezado móvil */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-zinc-200 bg-white/95 px-4 shadow-sm backdrop-blur lg:hidden">
        <div className="flex items-center gap-3">
          <img
            src="/pwa-192x192.png"
            alt=""
            width={36}
            height={36}
            className="h-9 w-9 rounded-lg"
          />

          <div>
            <p className="text-sm font-black text-zinc-900">
              UAI Planner
            </p>

            <p className="text-xs text-zinc-500">
              Planificador académico
            </p>
          </div>
        </div>

        <button
          type="button"
          aria-label="Abrir menú"
          aria-expanded={isMobileMenuOpen}
          aria-controls="mobile-navigation"
          onClick={() =>
            setIsMobileMenuOpen(true)
          }
          className="flex h-11 w-11 items-center justify-center rounded-lg border border-zinc-200 bg-white text-[#7B1730] transition hover:bg-zinc-50"
        >
          <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
      </header>

      {/* Fondo del menú móvil */}
      {isMobileMenuOpen && (
        <button
          type="button"
          aria-label="Cerrar menú"
          onClick={closeMobileMenu}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Navegación móvil */}
      <aside
        id="mobile-navigation"
        aria-hidden={!isMobileMenuOpen}
        className={`fixed inset-y-0 left-0 z-50 flex w-[82%] max-w-[290px] flex-col overflow-y-auto bg-[#7B1730] text-white shadow-2xl transition-transform duration-300 lg:hidden [&::-webkit-scrollbar]:hidden ${
          isMobileMenuOpen
            ? "translate-x-0"
            : "-translate-x-full"
        }`}
        style={{
          scrollbarWidth: "none",
        }}
      >
        <div className="flex items-start justify-between px-5 pb-5 pt-7">
          <div>
            <img
              src="/pwa-192x192.png"
              alt=""
              width={40}
              height={40}
              className="h-10 w-10 rounded-xl ring-1 ring-white/20"
            />

            <h2 className="mt-4 text-xl font-black">
              UAI Planner
            </h2>

            <p className="mt-1 text-xs text-white/50">
              Planificador académico
            </p>
          </div>

          <button
            type="button"
            aria-label="Cerrar menú"
            onClick={closeMobileMenu}
            className="flex h-11 w-11 items-center justify-center rounded-lg bg-white/10 transition hover:bg-white/15"
          >
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M7 7l10 10M17 7 7 17" />
            </svg>
          </button>
        </div>

        <div className="mx-5 border-t border-white/10" />

        <nav
          aria-label="Navegación móvil"
          className="flex-1 px-4 py-6"
        >
          {renderNavigation(true)}
        </nav>

        <div className="mx-5 border-t border-white/10" />

        <div className="px-6 py-5">
          <p className="text-[11px] leading-5 text-white/40">
            Herramienta independiente.
            Verificá siempre la información
            académica oficial.
          </p>
        </div>
      </aside>

      {/* Contenido */}
      <main className="min-h-screen px-4 py-6 sm:px-6 lg:ml-64 lg:px-10 lg:py-10">
        {children}
      </main>
    </div>
  );
}