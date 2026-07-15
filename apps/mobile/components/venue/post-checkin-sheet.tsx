import { useTranslation } from 'react-i18next';
import { useActiveCheckin } from '@/hooks/use-checkin';
import { useCheckinStore } from '@/stores/checkin.store';
import { VenueStatusSheet } from '@/components/venue/venue-status-sheet';

/**
 * Global one-shot sheet shown right after a successful check-in. It asks the
 * person for their status and whether they want to be visible to others at the
 * spot. Rendered once at the app root so it fires no matter where the check-in
 * happened (map, venue screen, QR/code flow).
 */
export function PostCheckinSheet() {
  const { t } = useTranslation();
  const promptId = useCheckinStore((s) => s.postCheckinPromptId);
  const clearPrompt = useCheckinStore((s) => s.clearPostCheckinPrompt);
  const { data: activeCheckin } = useActiveCheckin();

  if (!promptId || !activeCheckin || activeCheckin.id !== promptId) return null;

  return (
    <VenueStatusSheet
      checkinId={activeCheckin.id}
      currentStatusTag={activeCheckin.status_tag ?? null}
      isVisible={activeCheckin.is_visible ?? false}
      introTitle={t('checkin.statusPromptTitle', { defaultValue: "You're here!" })}
      introSubtitle={t('checkin.statusPromptBody', {
        defaultValue:
          'Set your status and choose whether others at this spot can see you.',
      })}
      onClose={clearPrompt}
    />
  );
}
