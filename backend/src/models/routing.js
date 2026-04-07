/**
 * Hardcoded deterministic routing logic mapping item IDs to counter IDs.
 * Evaluated strictly server-side to guarantee zero queue collision.
 */
const COUNTER_MAP = {
  // Counter 1
  'paneer_chapati': 'counter_1',
  
  // Counter 2
  'samosa': 'counter_2',
  'pattice': 'counter_2',
  'vada_pav': 'counter_2',
  
  // Counter 3
  'shabudana_khichadi': 'counter_3',
  'dal_khichadi': 'counter_3'
};

const routeOrder = (itemId) => {
  const counterId = COUNTER_MAP[itemId];
  if (!counterId) {
    throw new Error('UNMAPPED_ITEM');
  }
  return counterId;
};

module.exports = { routeOrder, COUNTER_MAP };
