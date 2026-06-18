export interface Character {
  slug:        string
  nameEs:      string
  nameEn:      string
  emoji:       string
  category:    string
  skinFile?:   string   // nombre del PNG en /skins/premade/ (sin extensión)
  tags:        string[]
}

// 65+ personajes — mezcla de atemporales, trending y estacionales
export const CHARACTERS: Character[] = [
  // === MARVEL ===
  { slug: 'spider-man',       nameEs: 'Spider-Man',       nameEn: 'Spider-Man',       emoji: '🕷️', category: 'Marvel',    skinFile: 'spiderman',       tags: ['superhero','marvel','spiderman'] },
  { slug: 'iron-man',         nameEs: 'Iron Man',         nameEn: 'Iron Man',         emoji: '🦾', category: 'Marvel',    skinFile: 'ironman',         tags: ['superhero','marvel','avengers'] },
  { slug: 'captain-america',  nameEs: 'Capitán América',  nameEn: 'Captain America',  emoji: '🛡️', category: 'Marvel',    skinFile: 'captain_america', tags: ['superhero','marvel','avengers'] },
  { slug: 'hulk',             nameEs: 'Hulk',             nameEn: 'Hulk',             emoji: '💚', category: 'Marvel',    skinFile: 'hulk',            tags: ['superhero','marvel','avengers'] },
  { slug: 'thor',             nameEs: 'Thor',             nameEn: 'Thor',             emoji: '⚡', category: 'Marvel',    skinFile: 'thor',            tags: ['superhero','marvel','avengers'] },
  { slug: 'black-widow',      nameEs: 'Viuda Negra',      nameEn: 'Black Widow',      emoji: '🕸️', category: 'Marvel',    tags: ['superhero','marvel','avengers'] },
  { slug: 'venom',            nameEs: 'Venom',            nameEn: 'Venom',            emoji: '🖤', category: 'Marvel',    tags: ['supervillain','marvel','spiderman'] },
  { slug: 'deadpool',         nameEs: 'Deadpool',         nameEn: 'Deadpool',         emoji: '💥', category: 'Marvel',    tags: ['superhero','marvel','funny'] },
  { slug: 'wolverine',        nameEs: 'Wolverine',        nameEn: 'Wolverine',        emoji: '🗡️', category: 'Marvel',    tags: ['superhero','marvel','xmen'] },
  { slug: 'thanos',           nameEs: 'Thanos',           nameEn: 'Thanos',           emoji: '💜', category: 'Marvel',    tags: ['supervillain','marvel','avengers'] },
  { slug: 'doctor-strange',   nameEs: 'Doctor Strange',   nameEn: 'Doctor Strange',   emoji: '🔮', category: 'Marvel',    tags: ['superhero','marvel','magic'] },
  { slug: 'black-panther',    nameEs: 'Pantera Negra',    nameEn: 'Black Panther',    emoji: '🐾', category: 'Marvel',    tags: ['superhero','marvel','wakanda'] },
  { slug: 'wanda',            nameEs: 'Bruja Escarlata',  nameEn: 'Scarlet Witch',    emoji: '🔴', category: 'Marvel',    tags: ['superhero','marvel','magic'] },
  { slug: 'loki',             nameEs: 'Loki',             nameEn: 'Loki',             emoji: '🐍', category: 'Marvel',    tags: ['supervillain','marvel','thor'] },
  // === DC ===
  { slug: 'batman',           nameEs: 'Batman',           nameEn: 'Batman',           emoji: '🦇', category: 'DC',        skinFile: 'batman',          tags: ['superhero','dc','gotham'] },
  { slug: 'superman',         nameEs: 'Superman',         nameEn: 'Superman',         emoji: '💫', category: 'DC',        skinFile: 'superman',        tags: ['superhero','dc','krypton'] },
  { slug: 'joker',            nameEs: 'Joker',            nameEn: 'Joker',            emoji: '🃏', category: 'DC',        tags: ['supervillain','dc','gotham'] },
  { slug: 'wonder-woman',     nameEs: 'Mujer Maravilla',  nameEn: 'Wonder Woman',     emoji: '⭐', category: 'DC',        skinFile: 'wonder_woman',    tags: ['superhero','dc','amazon'] },
  { slug: 'flash',            nameEs: 'The Flash',        nameEn: 'The Flash',        emoji: '⚡', category: 'DC',        tags: ['superhero','dc','speed'] },
  { slug: 'aquaman',          nameEs: 'Aquaman',          nameEn: 'Aquaman',          emoji: '🌊', category: 'DC',        tags: ['superhero','dc','atlantis'] },
  // === ANIME ===
  { slug: 'naruto',           nameEs: 'Naruto',           nameEn: 'Naruto',           emoji: '🍥', category: 'Anime',     skinFile: 'naruto',          tags: ['anime','ninja','naruto'] },
  { slug: 'goku',             nameEs: 'Goku',             nameEn: 'Goku',             emoji: '⚡', category: 'Anime',     skinFile: 'goku',            tags: ['anime','dbz','saiyan'] },
  { slug: 'sasuke',           nameEs: 'Sasuke',           nameEn: 'Sasuke',           emoji: '⚫', category: 'Anime',     tags: ['anime','ninja','naruto'] },
  { slug: 'luffy',            nameEs: 'Luffy',            nameEn: 'Luffy',            emoji: '⚓', category: 'Anime',     tags: ['anime','onepiece','pirate'] },
  { slug: 'zoro',             nameEs: 'Zoro',             nameEn: 'Zoro',             emoji: '⚔️', category: 'Anime',     tags: ['anime','onepiece','swordsman'] },
  { slug: 'tanjiro',          nameEs: 'Tanjiro',          nameEn: 'Tanjiro',          emoji: '🌊', category: 'Anime',     tags: ['anime','demonslayer','kimetsu'] },
  { slug: 'deku',             nameEs: 'Deku',             nameEn: 'Deku',             emoji: '💚', category: 'Anime',     tags: ['anime','mha','boku-no-hero'] },
  { slug: 'gojo',             nameEs: 'Gojo Satoru',      nameEn: 'Gojo Satoru',      emoji: '🔵', category: 'Anime',     tags: ['anime','jjk','jujutsu'] },
  { slug: 'levi-ackerman',    nameEs: 'Levi Ackerman',    nameEn: 'Levi Ackerman',    emoji: '⚔️', category: 'Anime',     tags: ['anime','aot','attackontitan'] },
  { slug: 'eren-yeager',      nameEs: 'Eren Yeager',      nameEn: 'Eren Yeager',      emoji: '🔑', category: 'Anime',     tags: ['anime','aot','attackontitan'] },
  { slug: 'saitama',          nameEs: 'Saitama',          nameEn: 'Saitama (One Punch Man)', emoji: '👊', category: 'Anime', tags: ['anime','onepunchman','opm'] },
  { slug: 'itachi',           nameEs: 'Itachi',           nameEn: 'Itachi',           emoji: '🌸', category: 'Anime',     tags: ['anime','ninja','naruto'] },
  { slug: 'vegeta',           nameEs: 'Vegeta',           nameEn: 'Vegeta',           emoji: '👑', category: 'Anime',     tags: ['anime','dbz','saiyan'] },
  // === VIDEOJUEGOS ===
  { slug: 'master-chief',     nameEs: 'Master Chief',     nameEn: 'Master Chief',     emoji: '🪖', category: 'Gaming',    skinFile: 'masterchief',     tags: ['gaming','halo','fps'] },
  { slug: 'steve-minecraft',  nameEs: 'Steve (Minecraft)', nameEn: 'Steve (Minecraft)', emoji: '⛏️', category: 'Gaming', skinFile: 'steve',           tags: ['minecraft','gaming','default'] },
  { slug: 'alex-minecraft',   nameEs: 'Alex (Minecraft)', nameEn: 'Alex (Minecraft)', emoji: '🌿', category: 'Gaming',    skinFile: 'alex',            tags: ['minecraft','gaming','default'] },
  { slug: 'mario',            nameEs: 'Mario',            nameEn: 'Mario',            emoji: '🍄', category: 'Gaming',    skinFile: 'mario',           tags: ['gaming','nintendo','mario'] },
  { slug: 'luigi',            nameEs: 'Luigi',            nameEn: 'Luigi',            emoji: '💚', category: 'Gaming',    skinFile: 'luigi',           tags: ['gaming','nintendo','mario'] },
  { slug: 'link-zelda',       nameEs: 'Link',             nameEn: 'Link',             emoji: '🗡️', category: 'Gaming',    skinFile: 'link',            tags: ['gaming','nintendo','zelda'] },
  { slug: 'pikachu',          nameEs: 'Pikachu',          nameEn: 'Pikachu',          emoji: '⚡', category: 'Gaming',    tags: ['gaming','pokemon','nintendo'] },
  { slug: 'charizard',        nameEs: 'Charizard',        nameEn: 'Charizard',        emoji: '🔥', category: 'Gaming',    tags: ['gaming','pokemon','fire'] },
  { slug: 'sonic',            nameEs: 'Sonic',            nameEn: 'Sonic',            emoji: '💨', category: 'Gaming',    skinFile: 'sonic',           tags: ['gaming','sega','sonic'] },
  { slug: 'kratos',           nameEs: 'Kratos',           nameEn: 'Kratos',           emoji: '⚔️', category: 'Gaming',    tags: ['gaming','godofwar','playstation'] },
  { slug: 'geralt',           nameEs: 'Geralt de Rivia',  nameEn: 'Geralt of Rivia',  emoji: '🐺', category: 'Gaming',    tags: ['gaming','witcher','rpg'] },
  { slug: 'joel-tlou',        nameEs: 'Joel',             nameEn: 'Joel (TLOU)',      emoji: '🌿', category: 'Gaming',    tags: ['gaming','thelastofus','playstation'] },
  { slug: 'master-sword-link', nameEs: 'Link (TOTK)',     nameEn: 'Link (Tears of the Kingdom)', emoji: '🌀', category: 'Gaming', tags: ['gaming','zelda','nintendo'] },
  { slug: 'jinx-arcane',      nameEs: 'Jinx',             nameEn: 'Jinx (Arcane)',    emoji: '💙', category: 'Gaming',    tags: ['gaming','league','arcane','netflix'] },
  { slug: 'vi-arcane',        nameEs: 'Vi',               nameEn: 'Vi (Arcane)',      emoji: '👊', category: 'Gaming',    tags: ['gaming','league','arcane','netflix'] },
  { slug: 'steve-games',      nameEs: 'Steve (Stranger Things)', nameEn: 'Steve Harrington', emoji: '🔦', category: 'Series', tags: ['netflix','strangerthings','series'] },
  // === PELÍCULAS ===
  { slug: 'darth-vader',      nameEs: 'Darth Vader',      nameEn: 'Darth Vader',      emoji: '⚫', category: 'Películas', tags: ['starwars','villain','disney'] },
  { slug: 'yoda',             nameEs: 'Yoda',             nameEn: 'Yoda',             emoji: '💚', category: 'Películas', tags: ['starwars','jedi','disney'] },
  { slug: 'jack-sparrow',     nameEs: 'Jack Sparrow',     nameEn: 'Jack Sparrow',     emoji: '🏴‍☠️', category: 'Películas', tags: ['disney','pirates','johnny-depp'] },
  { slug: 'shrek',            nameEs: 'Shrek',            nameEn: 'Shrek',            emoji: '💚', category: 'Películas', tags: ['dreamworks','funny','meme'] },
  { slug: 'gandalf',          nameEs: 'Gandalf',          nameEn: 'Gandalf',          emoji: '🧙', category: 'Películas', tags: ['lotr','tolkien','wizard'] },
  { slug: 'frodo',            nameEs: 'Frodo',            nameEn: 'Frodo Baggins',    emoji: '💍', category: 'Películas', tags: ['lotr','tolkien','hobbit'] },
  // === SERIES / STREAMING ===
  { slug: 'walter-white',     nameEs: 'Walter White',     nameEn: 'Walter White',     emoji: '🧪', category: 'Series',    tags: ['breakingbad','netflix','meme'] },
  { slug: 'eleven',           nameEs: 'Eleven',           nameEn: 'Eleven',           emoji: '🔵', category: 'Series',    tags: ['strangerthings','netflix','powers'] },
  { slug: 'wednesday-addams', nameEs: 'Wednesday',        nameEn: 'Wednesday Addams', emoji: '🖤', category: 'Series',    tags: ['wednesday','netflix','gothic'] },
  { slug: 'lupin',            nameEs: 'Lupin (serie)',     nameEn: 'Assane Diop',      emoji: '🎩', category: 'Series',    tags: ['netflix','french','series'] },
  // === YOUTUBERS / STREAMERS ===
  { slug: 'dream-smp',        nameEs: 'Dream',            nameEn: 'Dream',            emoji: '🎭', category: 'YouTubers', tags: ['youtube','minecraft','dreamsmp'] },
  { slug: 'technoblade',      nameEs: 'Technoblade',      nameEn: 'Technoblade',      emoji: '🐷', category: 'YouTubers', tags: ['youtube','minecraft','legend'] },
  { slug: 'philza',           nameEs: 'Philza',           nameEn: 'Philza',           emoji: '🪽', category: 'YouTubers', tags: ['youtube','minecraft','philza'] },
  { slug: 'ibai',             nameEs: 'Ibai Llanos',      nameEn: 'Ibai',             emoji: '🎙️', category: 'YouTubers', tags: ['youtube','streamer','spanish'] },
  { slug: 'rubius',           nameEs: 'El Rubius',        nameEn: 'El Rubius',        emoji: '🔴', category: 'YouTubers', tags: ['youtube','spanish','gaming'] },
  // === MEMES / INTERNET ===
  { slug: 'among-us-red',     nameEs: 'Among Us (Rojo)',  nameEn: 'Among Us (Red)',   emoji: '🔴', category: 'Memes',     tags: ['meme','amogus','impostor'] },
  { slug: 'sus-crewmate',     nameEs: 'El Impostor',      nameEn: 'The Impostor',     emoji: '😈', category: 'Memes',     tags: ['meme','amogus','funny'] },
  // === MINECRAFT ESPECÍFICO ===
  { slug: 'herobrine',        nameEs: 'Herobrine',        nameEn: 'Herobrine',        emoji: '👁️', category: 'Minecraft', skinFile: 'herobrine',       tags: ['minecraft','creepypasta','legend'] },
  { slug: 'creeper-humano',   nameEs: 'Creeper Humanizado', nameEn: 'Humanized Creeper', emoji: '💚', category: 'Minecraft', skinFile: 'creeper',      tags: ['minecraft','creeper','humanized'] },
  { slug: 'enderman-humano',  nameEs: 'Enderman Humanizado', nameEn: 'Humanized Enderman', emoji: '🖤', category: 'Minecraft', tags: ['minecraft','enderman','humanized'] },
  { slug: 'notch',            nameEs: 'Notch',            nameEn: 'Notch',            emoji: '⛏️', category: 'Minecraft', tags: ['minecraft','creator','history'] },
  // === ANIME (nuevos) ===
  { slug: 'denji',            nameEs: 'Denji (Chainsaw Man)', nameEn: 'Denji (Chainsaw Man)', emoji: '🪚', category: 'Anime', tags: ['anime','chainsawman','denji'] },
  { slug: 'makima',           nameEs: 'Makima',           nameEn: 'Makima',           emoji: '🔗', category: 'Anime',     tags: ['anime','chainsawman','villain'] },
  { slug: 'power-csm',        nameEs: 'Power (Chainsaw Man)', nameEn: 'Power (Chainsaw Man)', emoji: '🩸', category: 'Anime', tags: ['anime','chainsawman','devil'] },
  { slug: 'anya-forger',      nameEs: 'Anya Forger',      nameEn: 'Anya Forger',      emoji: '🥜', category: 'Anime',     tags: ['anime','spyxfamily','cute'] },
  { slug: 'loid-forger',      nameEs: 'Loid Forger',      nameEn: 'Loid Forger',      emoji: '🕵️', category: 'Anime',     tags: ['anime','spyxfamily','spy'] },
  { slug: 'sukuna',           nameEs: 'Ryomen Sukuna',    nameEn: 'Ryomen Sukuna',    emoji: '👹', category: 'Anime',     tags: ['anime','jjk','jujutsu','king'] },
  { slug: 'nezuko',           nameEs: 'Nezuko',           nameEn: 'Nezuko',           emoji: '🌸', category: 'Anime',     tags: ['anime','demonslayer','kimetsu'] },
  { slug: 'zenitsu',          nameEs: 'Zenitsu',          nameEn: 'Zenitsu',          emoji: '⚡', category: 'Anime',     tags: ['anime','demonslayer','thunder'] },
  // === GAMING (nuevos) ===
  { slug: 'v-cyberpunk',      nameEs: 'V (Cyberpunk 2077)', nameEn: 'V (Cyberpunk 2077)', emoji: '🤖', category: 'Gaming', tags: ['gaming','cyberpunk','cd-projekt'] },
  { slug: 'the-tarnished',    nameEs: 'El Sin Gracia',    nameEn: 'The Tarnished',    emoji: '⚔️', category: 'Gaming',    tags: ['gaming','eldenring','fromsoftware'] },
  { slug: 'aloy',             nameEs: 'Aloy',             nameEn: 'Aloy',             emoji: '🏹', category: 'Gaming',    tags: ['gaming','horizonzerodawn','sony'] },
  { slug: '2b-nier',          nameEs: '2B (NieR)',        nameEn: '2B (NieR Automata)', emoji: '⚙️', category: 'Gaming', tags: ['gaming','nier','automata'] },
  // === PELÍCULAS (nuevos) ===
  { slug: 'gollum',           nameEs: 'Gollum',           nameEn: 'Gollum',           emoji: '💍', category: 'Películas', tags: ['lotr','tolkien','precious'] },
  { slug: 'thanos-endgame',   nameEs: 'Thanos (Endgame)', nameEn: 'Thanos (Endgame)', emoji: '🟣', category: 'Películas', tags: ['marvel','avengers','infinity'] },
]

// Devuelve el personaje del día basado en la fecha
export function getCharacterOfTheDay(date = new Date()): Character {
  const dayOfYear = Math.floor(
    (date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000
  )
  return CHARACTERS[dayOfYear % CHARACTERS.length]
}

// Devuelve el personaje por slug
export function getCharacterBySlug(slug: string): Character | null {
  return CHARACTERS.find(c => c.slug === slug) ?? null
}

export function getAllCharacterSlugs(): string[] {
  return CHARACTERS.map(c => c.slug)
}
