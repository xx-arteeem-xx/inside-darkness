/**
 * Расы и классы Fabled Roots для главной страницы.
 * Свойства переписаны из сводных таблиц документации: src/content/docs/races.md и classes.md.
 * Если там что-то поменяется, поправьте и здесь. Подробности остаются в документации.
 */
import type { ClassId, RaceId } from '../lib/emblems';

export interface Race {
  id: RaceId;
  name: string;
  en: string;
  about: string;
  home: string;
  weapon: string;
  ability: string;
  height: string;
}

export interface Klass {
  id: ClassId;
  name: string;
  en: string;
  skill: string;
  xp: string;
}

export const RACES: Race[] = [
  { id: 'aetherian', name: 'Эфириец', en: 'Aetherian', about: 'Небесный народ, который лучше всего чувствует себя на высоте.', home: 'выше Y 200', weapon: 'копьё', ability: 'держать прыжок: Левитация', height: '90–110%' },
  { id: 'dunesworn', name: 'Дюнник', en: 'Dunesworn', about: 'Выносливые странники пустынь.', home: 'пустыни', weapon: 'скимитар', ability: 'присесть: высушить мокрую губку в руке', height: '85–95%' },
  { id: 'endling', name: 'Эндлинг', en: 'Endling', about: 'Странный народ из Энда.', home: 'Энд', weapon: 'коса', ability: 'присесть: Левитация всем рядом', height: '105–120%' },
  { id: 'frostborne', name: 'Морозо\u00ADрождённый', en: 'Frostborne', about: 'Жители снегов, привычные к холоду.', home: 'снежные биомы', weapon: 'дубина', ability: 'присесть: Замедление III всем рядом', height: '95–105%' },
  { id: 'moonshroud', name: 'Лунник', en: 'Moonshroud', about: 'Ночной народ, который двигается как тень.', home: 'ночь', weapon: 'метательный нож', ability: 'присесть: Невидимость', height: '85–100%' },
  { id: 'netherian', name: 'Незериец', en: 'Netherian', about: 'Огнеупорный народ Незера.', home: 'Незер', weapon: 'палаш', ability: 'бег: Огнестойкость', height: '90–110%' },
  { id: 'oakhearted', name: 'Дубосерд', en: 'Oakhearted', about: 'Лесной народ, спокойный и крепкий.', home: 'леса', weapon: 'топорик', ability: 'присесть: Слабость всем рядом', height: '100–110%' },
  { id: 'orebringer', name: 'Рудоносец', en: 'Orebringer', about: 'Пещерные жители и рудокопы.', home: 'ниже Y 0', weapon: 'булава', ability: 'присесть: Спешка', height: '75–90%' },
  { id: 'palehearted', name: 'Бледносерд', en: 'Palehearted', about: 'Тихий народ, привычный к темноте и заброшенным местам.', home: 'Бледный сад', weapon: 'рапира', ability: 'присесть: Ночное зрение', height: '100–110%' },
  { id: 'turtlekin', name: 'Черепашич', en: 'Turtlekin', about: 'Морской народ с крепким панцирем.', home: 'океаны', weapon: 'трезубец', ability: 'бег: Сила источника', height: '85–110%' },
];

export const CLASSES: Klass[] = [
  { id: 'builder', name: 'Строитель', en: 'Builder', skill: 'Дотягивается до блоков с 6,5 блока вместо 4,5.', xp: 'установку блоков' },
  { id: 'survivor', name: 'Выживальщик', en: 'Survivor', skill: 'При получении урона с шансом 25% получает Регенерацию II на 2 секунды.', xp: 'полученный урон' },
  { id: 'miner', name: 'Шахтёр', en: 'Miner', skill: 'Ломает блоки на 50% быстрее.', xp: 'добычу руд' },
  { id: 'rancher', name: 'Скотовод', en: 'Rancher', skill: 'Животное, на котором вы едете, получает Скорость III.', xp: 'приручение и разведение животных' },
  { id: 'archer', name: 'Стрелок', en: 'Archer', skill: 'Цель, задетая стрелой из лука или арбалета, получает Ветровой заряд на 10 секунд.', xp: 'попадания из лука и арбалета' },
  { id: 'fighter', name: 'Воин', en: 'Fighter', skill: 'Урон при атаке +10%, за убийство Сила III на 5 секунд.', xp: 'убийства и блок щитом' },
  { id: 'hermit', name: 'Отшельник', en: 'Hermit', skill: 'Сила II, пока рядом никого нет.', xp: 'время в одиночестве' },
  { id: 'bard', name: 'Бард', en: 'Bard', skill: 'Козьи рога накладывают эффекты.', xp: 'игру на козьем роге' },
  { id: 'cleric', name: 'Жрец', en: 'Cleric', skill: 'Отравление, Замедление и Слабость снимаются каждую секунду.', xp: 'зелья и торговлю со священниками' },
  { id: 'scout', name: 'Следопыт', en: 'Scout', skill: 'Видит игроков на локаторе с 256 блоков, враждебные мобы рядом светятся.', xp: 'время рядом с враждебными мобами' },
];
