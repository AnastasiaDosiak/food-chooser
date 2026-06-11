import './ChoiceCard.scss';

interface ChoiceCardProps {
  emoji: string;
  title: string;
  description: string;
  isSelected?: boolean;
  onClick: () => void;
}

export const ChoiceCard = ({ emoji, title, description, isSelected = false, onClick }: ChoiceCardProps) => (
  <button
    type="button"
    className={`choice-card${isSelected ? ' choice-card--selected' : ''}`}
    onClick={onClick}
  >
    <span className="choice-card__emoji">{emoji}</span>
    <span className="choice-card__title">{title}</span>
    <span className="choice-card__description">{description}</span>
  </button>
);
