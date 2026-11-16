// The Game Awards 2025, from "VGA 2025 (Responses)" (Responses tab).
// Winners: VGC's complete winners list (videogameschronicle.com), cross-checked with Wikipedia.
// Reveal answers: VGC and CGMagazine announcement roundups and Wikipedia.
// Names are normalised: typos fixed, one spelling per game.
import { award, reveal, type HistoryShow } from './types';

const d = 'dave';
const c = 'chris';
const g = 'garrett';

const CO = 'Clair Obscur: Expedition 33';
const SS = 'Hollow Knight: Silksong';
const SF = 'Split Fiction';
const DS2 = 'Death Stranding 2: On the Beach';
const BF6 = 'Battlefield 6';
const MKW = 'Mario Kart World';

const show: HistoryShow = {
  year: 2025,
  name: 'The Game Awards 2025',
  startsAt: '2025-12-12T00:30:00Z', // Dec 11, 7:30pm ET
  players: [
    { key: g, name: 'Garrett' },
    { key: d, name: 'Dave' },
    { key: c, name: 'Chris' },
  ],
  categories: [
    award('Game of the Year', CO, { [d]: CO, [c]: SS, [g]: CO }),
    award('Best Game Direction', CO, { [d]: CO, [c]: SF, [g]: CO }),
    award('Best Narrative', CO, { [d]: CO, [c]: DS2, [g]: CO }),
    award('Best Art Direction', CO, { [d]: CO, [c]: CO, [g]: CO }),
    award('Best Score and Music', CO, { [d]: CO, [c]: SS, [g]: CO }),
    award('Best Audio Design', BF6, { [d]: DS2, [c]: BF6, [g]: 'Ghost of Yōtei' }),
    award(
      'Best Performance',
      'Jennifer English',
      { [d]: 'Ben Starr', [c]: 'Ben Starr', [g]: 'Jennifer English' },
      { 'Jennifer English': CO, 'Ben Starr': CO },
    ),
    award('Games for Impact', 'South of Midnight', {
      [d]: 'Despelote',
      [c]: 'Lost Records: Bloom & Rage',
      [g]: 'South of Midnight',
    }),
    award('Best Ongoing Game', "No Man's Sky", { [d]: 'Fortnite', [c]: 'Fortnite', [g]: 'Fortnite' }),
    award('Best Community Support', "Baldur's Gate 3", {
      [d]: "No Man's Sky",
      [c]: "Baldur's Gate 3",
      [g]: 'Final Fantasy XIV',
    }),
    award('Best Independent Game', CO, { [d]: 'Absolum', [c]: SS, [g]: CO }),
    award('Best Debut Indie Game', CO, { [d]: CO, [c]: CO, [g]: CO }),
    award('Best Mobile Game', 'Umamusume: Pretty Derby', {
      [d]: 'Persona 5: The Phantom X',
      [c]: 'Persona 5: The Phantom X',
      [g]: 'Umamusume: Pretty Derby',
    }),
    award('Best VR/AR Game', 'The Midnight Walk', {
      [d]: "Marvel's Deadpool VR",
      [c]: 'Alien: Rogue Incursion',
      [g]: 'Alien: Rogue Incursion',
    }),
    award('Best Action Game', 'Hades II', { [d]: 'Hades II', [c]: BF6, [g]: 'Hades II' }),
    award('Best Action/Adventure Game', SS, { [d]: SS, [c]: SF, [g]: SS }),
    award('Best RPG', CO, { [d]: CO, [c]: 'Kingdom Come: Deliverance II', [g]: CO }),
    award('Best Fighting Game', 'Fatal Fury: City of the Wolves', {
      [d]: 'Fatal Fury: City of the Wolves',
      [c]: 'Mortal Kombat: Legacy Kollection',
      [g]: 'Fatal Fury: City of the Wolves',
    }),
    award('Best Family Game', 'Donkey Kong Bananza', {
      [d]: 'Donkey Kong Bananza',
      [c]: MKW,
      [g]: 'Donkey Kong Bananza',
    }),
    award('Best Sim/Strategy Game', 'Final Fantasy Tactics - The Ivalice Chronicles', {
      [d]: 'Final Fantasy Tactics - The Ivalice Chronicles',
      [c]: "Sid Meier's Civilization VII",
      [g]: 'The Alters',
    }),
    award('Best Sports/Racing Game', MKW, { [d]: MKW, [c]: 'EA Sports FC 26', [g]: MKW }),
    award('Best Multiplayer Game', 'Arc Raiders', { [d]: 'Arc Raiders', [c]: BF6, [g]: 'Arc Raiders' }),
    award('Best Adaptation', 'The Last of Us: Season 2', {
      [d]: 'Devil May Cry',
      [c]: 'The Last of Us: Season 2',
      [g]: 'A Minecraft Movie',
    }),
    award('Most Anticipated Game', 'Grand Theft Auto VI', {
      [d]: 'Grand Theft Auto VI',
      [c]: 'Grand Theft Auto VI',
      [g]: 'Grand Theft Auto VI',
    }),
    award('Content Creator of the Year', 'MoistCr1TiKaL', {
      [d]: 'The Burnt Peanut',
      [c]: 'The Burnt Peanut',
      [g]: 'Kai Cenat',
    }),

    reveal('Judas (Ken Levine/Bioshock creator) new gameplay trailer?', false, { [d]: true, [c]: true, [g]: false }),
    reveal('Control Resonant (Control sequel) tease/trailer?', true, { [d]: true, [c]: true, [g]: true }),
    reveal("New game tease/trailer for Larian (Baldur's Gate developers)?", true, { [d]: false, [c]: true, [g]: true }),
    reveal('The Duskbloods (FromSoftware) release date/window?', false, { [d]: false, [c]: false, [g]: false }),
    reveal('GTA VI trailer?', false, { [d]: true, [c]: true, [g]: false }),
    reveal('Persona 6 or new Atlus game teaser/trailer?', false, { [d]: true, [c]: true, [g]: true }),
  ],
};

export default show;
