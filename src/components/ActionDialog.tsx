import React from 'react';
import Portal from './Portal';

type ActionDialogProps = {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  showCancel?: boolean;
  variant?: 'default' | 'danger' | 'success';
};

const variantClassMap: Record<NonNullable<ActionDialogProps['variant']>, string> = {
  default: 'bg-blue-600 hover:bg-blue-700 shadow-blue-100',
  danger: 'bg-rose-600 hover:bg-rose-700 shadow-rose-100',
  success: 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100',
};

export const ActionDialog: React.FC<ActionDialogProps> = ({
  open,
  title,
  message,
  confirmText = '确定',
  cancelText = '取消',
  onConfirm,
  onCancel,
  showCancel = true,
  variant = 'default',
}) => {
  if (!open) return null;

  return (
    <Portal>
      <div className="fixed inset-0 z-[120] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden animate-scaleIn">
          <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/60">
            <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          </div>
          <div className="px-6 py-5">
            <p className="text-sm leading-6 text-slate-700 whitespace-pre-wrap">{message}</p>
          </div>
          <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-white">
            {showCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-5 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors"
              >
                {cancelText}
              </button>
            )}
            <button
              type="button"
              onClick={onConfirm}
              className={`px-5 py-2 rounded-xl text-white font-semibold shadow-lg transition-colors ${variantClassMap[variant]}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
};

export default ActionDialog;
