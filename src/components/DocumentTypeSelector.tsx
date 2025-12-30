import { motion } from 'framer-motion';
import { FileText, FileStack, FolderArchive, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DocumentType, PRICING } from '@/types/certification';

interface DocumentTypeSelectorProps {
  selected: DocumentType;
  onSelect: (type: DocumentType) => void;
  fileCount: number;
}

const ICONS = {
  single: FileText,
  report: FileStack,
  bundle: FolderArchive,
};

export function DocumentTypeSelector({ selected, onSelect, fileCount }: DocumentTypeSelectorProps) {
  const isDisabled = (type: DocumentType) => {
    if (type === 'single' && fileCount > 1) return true;
    if (type === 'report' && fileCount > 10) return true;
    return false;
  };

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {(Object.entries(PRICING) as [DocumentType, typeof PRICING.single][]).map(([type, tier]) => {
        const Icon = ICONS[type];
        const disabled = isDisabled(type);
        const isSelected = selected === type;

        return (
          <motion.button
            key={type}
            onClick={() => !disabled && onSelect(type)}
            disabled={disabled}
            whileHover={!disabled ? { scale: 1.02 } : {}}
            whileTap={!disabled ? { scale: 0.98 } : {}}
            className={cn(
              'relative p-6 rounded-xl border-2 text-left transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2',
              isSelected
                ? 'border-accent bg-accent/5 shadow-elevated'
                : 'border-border bg-card hover:border-accent/30',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            {isSelected && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-3 right-3 w-6 h-6 rounded-full bg-accent flex items-center justify-center"
              >
                <Check className="w-4 h-4 text-accent-foreground" />
              </motion.div>
            )}

            <div className={cn(
              'w-12 h-12 rounded-xl flex items-center justify-center mb-4',
              isSelected ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground'
            )}>
              <Icon className="w-6 h-6" />
            </div>

            <h3 className="font-display text-lg font-semibold text-foreground mb-1">
              {tier.name}
            </h3>
            
            <p className="text-sm text-muted-foreground mb-4">
              {tier.description}
            </p>

            <div className="flex items-baseline gap-1 mb-4">
              <span className="text-2xl font-display font-bold text-foreground">
                ${(tier.price / 100).toFixed(2)}
              </span>
              <span className="text-sm text-muted-foreground">USD</span>
            </div>

            <ul className="space-y-2">
              {tier.features.slice(0, 4).map((feature, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Check className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                  {feature}
                </li>
              ))}
              {tier.features.length > 4 && (
                <li className="text-xs text-accent font-medium">
                  +{tier.features.length - 4} more features
                </li>
              )}
            </ul>

            {disabled && (
              <p className="mt-4 text-xs text-destructive">
                {type === 'single' ? 'Only available for single files' : `Max ${type === 'report' ? '10' : '25'} files`}
              </p>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
