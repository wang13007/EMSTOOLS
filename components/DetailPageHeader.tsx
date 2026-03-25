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
        'relative isolate overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-lg shadow-slate-200/50 md:p-5',
        className,
      )}
    >
      <div className="space-y-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0 space-y-3">
            {eyebrow ? <div className="flex flex-wrap items-center gap-2 text-xs">{eyebrow}</div> : null}

            <div className="space-y-1.5">
              <h2 className="text-2xl font-black tracking-tight text-slate-900 md:text-[1.75rem]">{title}</h2>
              {subtitle ? <div className="text-sm text-slate-600">{subtitle}</div> : null}
            </div>
          </div>

          {actions ? (
            <div
              data-export-hide={actionsHiddenOnExport ? 'true' : undefined}
              className="flex flex-wrap items-center gap-2 xl:max-w-[48%] xl:justify-end"
            >
              {actions}
            </div>
          ) : null}
        </div>

        {tabs.length || footer ? (
          <div className="space-y-3 border-t border-slate-200/80 pt-3">
            {tabs.length ? (
              <div
                data-export-hide={tabsHiddenOnExport ? 'true' : undefined}
                className="inline-flex max-w-full flex-wrap rounded-2xl border border-slate-200 bg-slate-50 p-1"
              >
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={tab.onClick}
                    disabled={tab.disabled}
                    className={joinClassNames(
                      'rounded-xl px-4 py-2 text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:text-slate-400',
                      tab.active ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200' : 'text-slate-600 hover:bg-white',
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            ) : null}

            {footer ? <div>{footer}</div> : null}
          </div>
        ) : null}
      </div>
    </section>
  );
};
