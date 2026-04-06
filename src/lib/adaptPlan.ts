import type { DailyCheckIn } from '@/contexts/AppContext';

export interface AdaptedBlock {
  type: string;
  label: string;
  time: string;
  duration: number;
  description: string;
  priority: string;
  completed?: boolean;
  adapted?: boolean;
  originalLabel?: string;
  originalDuration?: number;
}

/**
 * Adapt today's plan blocks based on the user's check-in data.
 * Premium-only feature.
 */
export function adaptTodayBlocks(blocks: any[], checkIn: DailyCheckIn): AdaptedBlock[] {
  return blocks.map((block) => {
    const isTraining = block.type === 'training';
    const isMovement = block.type === 'movement';
    let adapted = false;
    let newLabel = block.label;
    let newDuration = block.duration;

    // Rule 1: Sleep < 5.5h + training → light movement, -50%
    if (checkIn.sleepHours < 5.5 && isTraining) {
      newLabel = `Leichte Bewegung (statt ${block.label})`;
      newDuration = Math.round(block.duration * 0.5);
      adapted = true;
    }
    // Rule 2: Stress >= 8 + training → -30%
    else if (checkIn.stress >= 8 && isTraining) {
      newDuration = Math.round(block.duration * 0.7);
      adapted = true;
    }
    // Rule 3: Energy <= 3 + training/movement → -40%
    else if (checkIn.energy <= 3 && (isTraining || isMovement)) {
      newDuration = Math.round(block.duration * 0.6);
      adapted = true;
    }

    if (adapted) {
      return {
        ...block,
        label: newLabel,
        duration: newDuration,
        adapted: true,
        originalLabel: block.label,
        originalDuration: block.duration,
      };
    }

    return { ...block, adapted: false };
  });
}
