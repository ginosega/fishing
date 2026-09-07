import { GearRepository } from './gear-store.js';
import { validateKbBundle, validateCatchBundle, groupEntitiesByType, catchesForEntity } from './kb-model.js';
import { renderMarkdown, renderCatchCard, formatCatchDate, formatCatchSize } from './markdown-render.js';

const TYPE_META = {
  location: { label:'Locations', icon:'📍', description:'Waters, access, seasonal patterns, and local observations' },
  species: { label:'Species', icon:'🐟', description:'Fish identification, behavior, habitat, and targeting notes' },
  equipment: { label:'Gear Guides', icon:'🧰', description:'Equipment, rigs, and presentations reference' },
  technique: { label:'Techniques', icon:'🧭', description:'Strategy, conditions, and species reference.' },
  knot: { label:'Knots', icon:'🪢', description:'Connection guidance, cautions, and learning resources' }
};
