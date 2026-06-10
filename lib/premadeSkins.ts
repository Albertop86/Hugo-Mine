export type SkinCategory = 'superheroes' | 'cultura-pop' | 'profesiones' | 'clasicos'

export interface PremadeSkin {
  id:       string
  file:     string
  name:     string
  nameEn:   string
  category: SkinCategory
}

export const PREMADE_SKINS: PremadeSkin[] = [
  // Superhéroes
  { id: 'spiderman',       file: 'spiderman.png',       name: 'Spider-Man',       nameEn: 'Spider-Man',       category: 'superheroes' },
  { id: 'batman',          file: 'batman.png',          name: 'Batman',           nameEn: 'Batman',           category: 'superheroes' },
  { id: 'superman',        file: 'superman.png',        name: 'Superman',         nameEn: 'Superman',         category: 'superheroes' },
  { id: 'ironman',         file: 'ironman.png',         name: 'Iron Man',         nameEn: 'Iron Man',         category: 'superheroes' },
  { id: 'captain_america', file: 'captain_america.png', name: 'Capitán América',  nameEn: 'Captain America',  category: 'superheroes' },
  { id: 'thor',            file: 'thor.png',            name: 'Thor',             nameEn: 'Thor',             category: 'superheroes' },
  { id: 'hulk',            file: 'hulk.png',            name: 'Hulk',             nameEn: 'Hulk',             category: 'superheroes' },
  { id: 'wonder_woman',    file: 'wonder_woman.png',    name: 'Wonder Woman',     nameEn: 'Wonder Woman',     category: 'superheroes' },
  // Cultura pop
  { id: 'mario',           file: 'mario.png',           name: 'Mario',            nameEn: 'Mario',            category: 'cultura-pop' },
  { id: 'luigi',           file: 'luigi.png',           name: 'Luigi',            nameEn: 'Luigi',            category: 'cultura-pop' },
  { id: 'link',            file: 'link.png',            name: 'Link',             nameEn: 'Link',             category: 'cultura-pop' },
  { id: 'goku',            file: 'goku.png',            name: 'Goku',             nameEn: 'Goku',             category: 'cultura-pop' },
  { id: 'sonic',           file: 'sonic.png',           name: 'Sonic',            nameEn: 'Sonic',            category: 'cultura-pop' },
  { id: 'naruto',          file: 'naruto.png',          name: 'Naruto',           nameEn: 'Naruto',           category: 'cultura-pop' },
  { id: 'ash',             file: 'ash.png',             name: 'Ash Ketchum',      nameEn: 'Ash Ketchum',      category: 'cultura-pop' },
  { id: 'masterchief',     file: 'masterchief.png',     name: 'Master Chief',     nameEn: 'Master Chief',     category: 'cultura-pop' },
  // Profesiones
  { id: 'doctor',          file: 'doctor.png',          name: 'Doctor',           nameEn: 'Doctor',           category: 'profesiones' },
  { id: 'astronaut',       file: 'astronaut.png',       name: 'Astronauta',       nameEn: 'Astronaut',        category: 'profesiones' },
  { id: 'ninja',           file: 'ninja.png',           name: 'Ninja',            nameEn: 'Ninja',            category: 'profesiones' },
  { id: 'pirate',          file: 'pirate.png',          name: 'Pirata',           nameEn: 'Pirate',           category: 'profesiones' },
  { id: 'viking',          file: 'viking.png',          name: 'Vikingo',          nameEn: 'Viking',           category: 'profesiones' },
  { id: 'chef',            file: 'chef.png',            name: 'Chef',             nameEn: 'Chef',             category: 'profesiones' },
  // Clásicos
  { id: 'steve',           file: 'steve.png',           name: 'Steve',            nameEn: 'Steve',            category: 'clasicos'    },
  { id: 'alex',            file: 'alex.png',            name: 'Alex',             nameEn: 'Alex',             category: 'clasicos'    },
  { id: 'herobrine',       file: 'herobrine.png',       name: 'Herobrine',        nameEn: 'Herobrine',        category: 'clasicos'    },
  { id: 'creeper',         file: 'creeper.png',         name: 'Creeper',          nameEn: 'Creeper',          category: 'clasicos'    },
]

export const CATEGORY_LABELS: Record<SkinCategory, { es: string; en: string; fr: string; pt: string }> = {
  'superheroes': { es: 'Superhéroes',  en: 'Superheroes',  fr: 'Super-héros',  pt: 'Super-heróis' },
  'cultura-pop': { es: 'Cultura pop',  en: 'Pop culture',  fr: 'Culture pop',  pt: 'Cultura pop'  },
  'profesiones': { es: 'Profesiones',  en: 'Professions',  fr: 'Professions',  pt: 'Profissões'   },
  'clasicos':    { es: 'Clásicos',     en: 'Classics',     fr: 'Classiques',   pt: 'Clássicos'    },
}
