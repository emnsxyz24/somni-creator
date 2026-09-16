'use client';

import * as React from 'react';
import { Video, Film, Camera, Play, FileText } from 'lucide-react';
import { cn } from 'cn';
import { DeliverableType } from '../types';

interface DeliverableTypeBadgeProps {
  type: DeliverableType;
  className?: string;
}

const TYPE_CONFIG: Record<
  DeliverableType,
  { label: string; className: string; icon: React.ComponentType<{ className?: string }> }
> = {
  [DeliverableType.TIKTOK]: {
    label: 'TikTok',
    className: 'border-pink-500/20 bg-pink-500/10 text-pink-700 dark:text-pink-300',
    icon: Film,
  },
  [DeliverableType.IG_REEL]: {
    label: 'Instagram Reel',
    className: 'border-fuchsia-500/20 bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-300',
    icon: Film,
  },
  [DeliverableType.IG_POST]: {
    label: 'Instagram Post',
    className: 'border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300',
    icon: Camera,
  },
  [DeliverableType.IG_STORY]: {
    label: 'Instagram Story',
    className: 'border-orange-500/20 bg-orange-500/10 text-orange-700 dark:text-orange-300',
    icon: Camera,
  },
  [DeliverableType.YOUTUBE_VIDEO]: {
    label: 'YouTube Video',
    className: 'border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-300',
    icon: Video,
  },
  [DeliverableType.YOUTUBE_SHORT]: {
    label: 'YouTube Short',
    className: 'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300',
    icon: Play,
  },
  [DeliverableType.OTHER]: {
    label: 'Other',
    className: 'border-border bg-muted text-muted-foreground',
    icon: FileText,
  },
};

export function DeliverableTypeBadge({
  type,
  className,
}: DeliverableTypeBadgeProps) {
  const config = TYPE_CONFIG[type] ?? {
    label: type,
    className: 'border-border bg-muted text-muted-foreground',
    icon: FileText,
  };
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap select-none',
        config.className,
        className,
      )}
    >
      <Icon className="size-3 shrink-0" />
      {config.label}
    </span>
  );
}

export function getDeliverableTypeLabel(type: DeliverableType): string {
  return TYPE_CONFIG[type]?.label ?? type;
}
