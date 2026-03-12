import React from 'react';

type DetailPageHeaderTab = {
  key: string;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  active?: boolean;
};

interface DetailPageHeaderProps {
  title: React.ReactNode;
  eyebrow?: React.ReactNode;
  subtitle?: React.ReactNode;
  tabs?: DetailPageHeaderTab[];
  tabsHiddenOnExport?: boolean;
  actions?: React.ReactNode;
  actionsHiddenOnExport?: boolean;
  footer?: React.ReactNode;
  className?: string;
}

const joinClassNames = (...values: Array<string | false | null | undefined>) => {
  return values.filter(Boolean).join(' ');
};

export const DetailPageHeader: React.FC<DetailPageHeaderProps> = ({
  title,
  eyebrow,
  subtitle,
  tabs = [],
  tabsHiddenOnExport = false,
  actions,
  actionsHiddenOnExport = false,
  footer,
  className = '',
}) => {
  return (
    <section
      className={joinClassNames(
        'relative overflow-hidden rounded-3xl border border-blue-200/70 bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-6 shadow-sm',
        className,
      )}
    >
      <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-blue-200/30" />
      <div className="absolute -bottom-12 left-1/3 h-32 w-32 rounded-full bg-cyan-200/30" />

      <div className="relative space-y-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 space-y-3">
            {eyebrow ? <div className="flex flex-wrap items-center gap-2">{eyebrow}</div> : null}

            <div className="space-y-2">
              <h2 className="text-3xl font-black tracking-tight text-slate-900">{title}</h2>
              {subtitle ? <div className="text-sm text-slate-600">{subtitle}</div> : null}
            </div>

            {tabs.length ? (
              <div
                data-export-hide={tabsHiddenOnExport ? 'true' : undefined}
                className="inline-flex rounded-2xl border border-slate-200 bg-white p-1 shadow-sm"
              >
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={tab.onClick}
                    disabled={tab.disabled}
                    className={joinClassNames(
                      'rounded-xl px-4 py-2 text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:text-slate-400',
                      tab.active ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100',
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          {actions ? (
            <div
              data-export-hide={actionsHiddenOnExport ? 'true' : undefined}
              className="flex flex-wrap items-center gap-3 lg:justify-end"
            >
              {actions}
            </div>
          ) : null}
        </div>

        {footer ? <div>{footer}</div> : null}
      </div>
    </section>
  );
};
