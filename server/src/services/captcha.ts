import Cap from '@cap.js/server';

let cap: Cap | undefined;

export function getCap() {
  if (!cap) {
    cap = new Cap({
      tokens_store_path: '.data/tokensList.json',
    });
  }
  return cap;
}
