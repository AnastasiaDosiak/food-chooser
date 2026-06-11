import type { ReactNode } from 'react';

import './StepShell.scss';

interface StepShellProps {
  kicker: string;
  title: string;
  subtitle: string;
  onBack?: () => void;
  children: ReactNode;
}

export const StepShell = ({ kicker, title, subtitle, onBack, children }: StepShellProps) => (
  <section className="step-shell">
    <header className="step-shell__header">
      <span className="step-shell__kicker">{kicker}</span>
      <h2 className="step-shell__title">{title}</h2>
      <p className="step-shell__subtitle">{subtitle}</p>
    </header>
    <div className="step-shell__content">{children}</div>
    {onBack && (
      <button type="button" className="step-shell__back" onClick={onBack}>
        ← take me back
      </button>
    )}
  </section>
);
