import type { FleetMissionKind } from '../simulation/fleets/types';
import { createIncomingFlightContacts } from '../simulation/intelligence/incomingFlights';
import type { GameState } from '../simulation/types';
import { getUnitDefinition } from '../simulation/units/catalog';
import { formatGameDuration } from './planetViewModel';

function missionLabel(mission: FleetMissionKind | null): string {
  switch (mission) {
    case 'transport': return 'Транспорт';
    case 'deploy': return 'Размещение';
    case 'scout': return 'Разведка';
    case 'attack': return 'Атака';
    case 'recycle': return 'Переработка';
    case 'colonize': return 'Колонизация';
    case 'expedition': return 'Экспедиция';
    case 'space-object': return 'Стратегический объект';
    case null: return 'Миссия не определена';
  }
}

function compositionLabel(ships: Readonly<Record<string, number>> | null): string {
  if (ships === null) return '';
  return Object.entries(ships)
    .map(([unitId, quantity]) => `${getUnitDefinition(unitId)?.name ?? unitId} × ${quantity}`)
    .join(' · ');
}

export function createIncomingFlightsSection(
  state: GameState,
  viewerEmpireId = 'player',
): HTMLElement {
  const section = document.createElement('section');
  section.className = 'incoming-intelligence-section';
  const heading = document.createElement('h2');
  heading.textContent = 'Входящие контакты';
  section.append(heading);

  const contacts = createIncomingFlightContacts(state, viewerEmpireId);
  for (const contact of contacts) {
    const card = document.createElement('article');
    card.className = `incoming-intelligence-card is-${contact.visibility}`;
    card.dataset.incomingContactId = contact.id;
    const title = document.createElement('strong');
    title.textContent = contact.sourceEmpireId === null
      ? 'Неизвестный контакт'
      : `Источник: ${contact.sourceEmpireId}`;
    const route = document.createElement('p');
    route.textContent = `Цель: ${contact.targetName} · ETA ${formatGameDuration(contact.etaSeconds)}`;
    card.append(title, route);
    if (contact.visibility === 'full') {
      const detail = document.createElement('p');
      detail.textContent = `${missionLabel(contact.missionKind)} · ${compositionLabel(contact.ships)}`;
      card.append(detail);
    }
    section.append(card);
  }

  if (contacts.length === 0) {
    const empty = document.createElement('p');
    empty.textContent = 'Входящих контактов к колониям империи нет.';
    section.append(empty);
  }
  return section;
}
