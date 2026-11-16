// The Game Awards 2024, from "VGA 2024 (Responses)" (owner's summary tab, Sheet1).
// Winners: https://en.wikipedia.org/wiki/The_Game_Awards_2024
// Reveal answers: Wikipedia's announcement list and VGC's roundup; none of the
// seven predicted reveals happened. The four reveal questions nobody answered
// (Erdtree, Moon Studios, Indiana Jones, Dragon Age) are left out.
// Names are normalised: typos fixed, one spelling per game, Yes/No for reveals.
import { award, reveal, type HistoryShow } from './types';

const g = 'garrett';
const b = 'brian';
const d = 'dave';

const AB = 'Astro Bot';
const ER = 'Elden Ring Shadow of the Erdtree';
const MR = 'Metaphor: ReFantazio';
const HB = "Senua's Saga: Hellblade II";
const SH = 'Silent Hill 2';
const FF7 = 'Final Fantasy VII Rebirth';
const BAL = 'Balatro';
const HD = 'Helldivers 2';
const BG3 = "Baldur's Gate 3";

const show: HistoryShow = {
  year: 2024,
  name: 'The Game Awards 2024',
  startsAt: '2024-12-13T00:30:00Z', // Dec 12, 7:30pm ET
  players: [
    { key: g, name: 'Garrett' },
    { key: b, name: 'Brian' },
    { key: d, name: 'Dave' },
  ],
  categories: [
    award('Game of the Year', AB, { [g]: AB, [b]: ER, [d]: AB }),
    award('Best Game Direction', AB, { [g]: MR, [b]: ER, [d]: ER }),
    award('Best Narrative', MR, { [g]: MR, [b]: HB, [d]: SH }),
    award('Best Art Direction', MR, { [g]: 'Neva', [b]: 'Neva', [d]: 'Neva' }),
    award('Best Score and Music', FF7, { [g]: AB, [b]: FF7, [d]: FF7 }),
    award('Best Audio Design', HB, { [g]: SH, [b]: SH, [d]: AB }),
    award(
      'Best Performance',
      'Melina Juergens',
      { [g]: 'Briana White', [b]: 'Melina Juergens', [d]: 'Briana White' },
      { 'Melina Juergens': HB, 'Briana White': FF7 },
    ),
    award('Innovation in Accessibility', 'Prince of Persia: The Lost Crown', {
      [g]: 'Diablo IV',
      [b]: 'Dragon Age: The Veilguard',
      [d]: 'Diablo IV',
    }),
    award('Games for Impact', 'Neva', { [g]: 'Tales of Kenzera: Zau', [b]: 'Neva', [d]: 'Tales of Kenzera: Zau' }),
    award('Best Ongoing Game', HD, { [g]: HD, [b]: 'Fortnite', [d]: 'Fortnite' }),
    award('Best Community Support', BG3, { [g]: 'Fortnite', [b]: BG3, [d]: BG3 }),
    award('Best Independent Game', BAL, { [g]: 'UFO 50', [b]: 'Animal Well', [d]: BAL }),
    award('Best Debut Indie Game', BAL, { [g]: BAL, [b]: BAL, [d]: BAL }),
    award('Best Mobile Game', BAL, {
      [g]: 'Pokémon Trading Card Game Pocket',
      [b]: 'Pokémon Trading Card Game Pocket',
      [d]: BAL,
    }),
    award('Best VR/AR Game', 'Batman: Arkham Shadow', {
      [g]: "Asgard's Wrath 2",
      [b]: 'Metro Awakening',
      [d]: 'Batman: Arkham Shadow',
    }),
    award('Best Action Game', 'Black Myth: Wukong', {
      [g]: 'Black Myth: Wukong',
      [b]: 'Black Myth: Wukong',
      [d]: 'Black Myth: Wukong',
    }),
    award('Best Action/Adventure Game', AB, { [g]: AB, [b]: AB, [d]: AB }),
    award('Best RPG', MR, { [g]: MR, [b]: MR, [d]: FF7 }),
    award('Best Fighting Game', 'Tekken 8', { [g]: 'Tekken 8', [b]: 'Dragon Ball: Sparking! Zero', [d]: 'Tekken 8' }),
    award('Best Family Game', AB, { [g]: AB, [b]: 'Super Mario Party Jamboree', [d]: 'Super Mario Party Jamboree' }),
    award('Best Sim/Strategy Game', 'Frostpunk 2', {
      [g]: 'Kunitsu-Gami: Path of the Goddess',
      [b]: 'Unicorn Overlord',
      [d]: 'Unicorn Overlord',
    }),
    award('Best Sports/Racing Game', 'EA Sports FC 25', { [g]: 'NBA 2K25', [b]: 'NBA 2K25', [d]: 'EA Sports FC 25' }),
    award('Best Multiplayer Game', HD, { [g]: HD, [b]: 'Call of Duty: Black Ops 6', [d]: HD }),
    award('Best Adaptation', 'Fallout', { [g]: 'Fallout', [b]: 'Arcane', [d]: 'Fallout' }),
    award('Most Anticipated Game', 'Grand Theft Auto VI', {
      [g]: 'Grand Theft Auto VI',
      [b]: 'Grand Theft Auto VI',
      [d]: 'Grand Theft Auto VI',
    }),
    award('Content Creator of the Year', 'CaseOh', { [g]: 'Usada Pekora', [b]: 'CaseOh', [d]: 'CaseOh' }),

    reveal('Death Stranding 2 trailer?', false, { [g]: true, [b]: true, [d]: true }),
    reveal('Judas (Ken Levine/Bioshock creator) new gameplay trailer?', false, { [g]: true, [b]: false, [d]: true }),
    reveal('Project 007 James Bond game trailer/teaser?', false, { [g]: false, [b]: true, [d]: false }),
    reveal('GTA VI trailer?', false, { [g]: true, [b]: true, [d]: true }),
    reveal('Wonder Woman?', false, { [g]: false, [b]: false, [d]: false }),
    reveal('Clair Obscur: Expedition 33 trailer?', false, { [g]: true, [b]: false, [d]: false }),
    reveal('South of Midnight trailer?', false, { [g]: false, [b]: false, [d]: false }),
  ],
};

export default show;
