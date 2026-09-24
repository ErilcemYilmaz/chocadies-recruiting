import type { Bewerbungsstatus } from '../api/typen';
import { anzeigename } from '../i18n/anzeigenamen';
import { useSprache } from '../i18n/SprachKontext';

export function StatusBadge({ status }: { status: Bewerbungsstatus }) {
  const { sprache } = useSprache();
  return <span className="badge">{anzeigename.status(status, sprache)}</span>;
}
