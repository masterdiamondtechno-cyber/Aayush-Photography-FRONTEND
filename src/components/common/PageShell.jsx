const PageShell = ({ children, className = '', title, subtitle, actions }) => {
  return (
    <div className={`mx-auto w-full max-w-[1400px] space-y-8 sm:space-y-10 ${className}`}>
      {(title || subtitle || actions) && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
          <div className="min-w-0 space-y-1.5">
            {title && (
              <h1 className="font-['Lexend'] text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="text-sm text-slate-500 sm:text-base">{subtitle}</p>
            )}
          </div>
          {actions && (
            <div className="flex flex-shrink-0 flex-wrap items-center gap-3">
              {actions}
            </div>
          )}
        </div>
      )}
      {children}
    </div>
  );
};

export default PageShell;
