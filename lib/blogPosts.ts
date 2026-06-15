export type Locale = 'es' | 'en' | 'fr' | 'pt'

export interface BlogSection {
  heading: string
  body: string
}

export interface BlogPost {
  slug: string
  date: string
  coverEmoji: string
  category: Record<Locale, string>
  title: Record<Locale, string>
  description: Record<Locale, string>
  metaTitle: Record<Locale, string>
  metaDesc: Record<Locale, string>
  intro: Record<Locale, string>
  sections: Record<Locale, BlogSection[]>
  cta: Record<Locale, { title: string; btn: string }>
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: 'crear-skin-minecraft-desde-foto',
    date: '2026-06-01',
    coverEmoji: '📸',
    category: { es: 'Tutorial', en: 'Tutorial', fr: 'Tutoriel', pt: 'Tutorial' },
    title: {
      es: 'Cómo crear tu skin de Minecraft desde una foto',
      en: 'How to create your Minecraft skin from a photo',
      fr: 'Comment créer ton skin Minecraft depuis une photo',
      pt: 'Como criar a tua skin do Minecraft a partir de uma foto',
    },
    description: {
      es: 'Aprende a convertir tu propia foto en una skin de Minecraft personalizada en menos de un minuto. Gratis, sin registro y compatible con Java y Bedrock.',
      en: 'Learn how to turn your own photo into a custom Minecraft skin in under a minute. Free, no sign-up, compatible with Java and Bedrock.',
      fr: 'Apprends à transformer ta propre photo en skin Minecraft personnalisé en moins d\'une minute. Gratuit, sans inscription.',
      pt: 'Aprende a transformar a tua foto numa skin do Minecraft personalizada em menos de um minuto. Grátis, sem registo.',
    },
    metaTitle: {
      es: 'Cómo crear tu skin de Minecraft desde una foto (gratis) – MakeSkins',
      en: 'How to create your Minecraft skin from a photo (free) – MakeSkins',
      fr: 'Comment créer ton skin Minecraft depuis une photo (gratuit) – MakeSkins',
      pt: 'Como criar a tua skin do Minecraft a partir de uma foto (grátis) – MakeSkins',
    },
    metaDesc: {
      es: 'Guía paso a paso para crear una skin de Minecraft personalizada desde tu propia foto. Gratis, sin registro, listo en segundos para Java y Bedrock.',
      en: 'Step-by-step guide to create a custom Minecraft skin from your own photo. Free, no sign-up, ready in seconds for Java and Bedrock.',
      fr: 'Guide étape par étape pour créer un skin Minecraft personnalisé depuis ta propre photo. Gratuit, sans inscription.',
      pt: 'Guia passo a passo para criar uma skin do Minecraft personalizada a partir da tua foto. Grátis, sem registo.',
    },
    intro: {
      es: 'Una de las mejores cosas de Minecraft es la posibilidad de personalizar completamente a tu personaje. Pero en lugar de usar una skin genérica descargada de internet, ¿qué tal si te conviertes tú mismo en un personaje de Minecraft? Con MakeSkins puedes hacerlo en menos de un minuto, completamente gratis y sin instalar nada.',
      en: 'One of the best things about Minecraft is the ability to completely customize your character. But instead of using a generic skin downloaded from the internet, what if you could turn yourself into a Minecraft character? With MakeSkins you can do it in under a minute, completely free and without installing anything.',
      fr: 'L\'une des meilleures choses dans Minecraft est la possibilité de personnaliser complètement ton personnage. Mais plutôt qu\'utiliser un skin générique téléchargé sur internet, et si tu te transformais toi-même en personnage Minecraft ? Avec MakeSkins, c\'est possible en moins d\'une minute, totalement gratuit.',
      pt: 'Uma das melhores coisas do Minecraft é a possibilidade de personalizar completamente o teu personagem. Mas em vez de usar uma skin genérica baixada da internet, e se te tornasses tu próprio um personagem do Minecraft? Com o MakeSkins podes fazê-lo em menos de um minuto, completamente grátis.',
    },
    sections: {
      es: [
        {
          heading: '¿Por qué tener una skin personalizada?',
          body: 'En los servidores multijugador, todos los jugadores empiezan con el mismo aspecto: Steve o Alex. Una skin personalizada te diferencia del resto, te da identidad y hace que tus amigos te reconozcan al instante. Además, si apareces como tú mismo, la experiencia es mucho más divertida e inmersiva.',
        },
        {
          heading: 'Qué necesitas para empezar',
          body: 'Solo necesitas dos cosas: una foto tuya donde se vea bien tu cara, y acceso a internet. No necesitas ninguna app adicional, ni cuenta, ni tarjeta de crédito. MakeSkins funciona directamente en el navegador de tu móvil o tu ordenador.',
        },
        {
          heading: 'Cómo funciona MakeSkins: paso a paso',
          body: '1. Sube tu foto — elige una foto de frente, bien iluminada, donde tu cara ocupe la mayor parte del encuadre.\n2. Ajusta el recorte — centra tu cara en el cuadro para que el resultado sea lo más preciso posible.\n3. Genera tu skin — en segundos obtienes un PNG de 64×64 píxeles con tu cara en el estilo de Minecraft.\n4. Descarga e instala — descarga el archivo y súbelo al launcher de Minecraft o a minecraft.net.',
        },
        {
          heading: 'Consejos para un mejor resultado',
          body: 'La calidad de la skin depende directamente de la foto. Para mejores resultados usa una foto de frente con buena iluminación natural (junto a una ventana es perfecto). Evita fotos con gafas de sol, gorras o poca luz. Cuanto más llene tu cara el encuadre, más detalle tendrá el personaje. Si el resultado no te convence, puedes usar el editor de píxeles de MakeSkins para retocar manualmente cualquier detalle.',
        },
        {
          heading: '¿Con qué versiones de Minecraft es compatible?',
          body: 'La skin generada por MakeSkins es un PNG de 64×64 píxeles compatible con todas las versiones de Minecraft: Java Edition (PC/Mac), Bedrock Edition (Windows, Xbox, PlayStation, Nintendo Switch y móvil). Una sola skin te sirve para todos tus dispositivos.',
        },
      ],
      en: [
        {
          heading: 'Why have a custom skin?',
          body: 'On multiplayer servers, all players start looking the same: Steve or Alex. A custom skin sets you apart, gives you an identity, and makes your friends recognize you instantly. Plus, if you appear as yourself, the experience is much more fun and immersive.',
        },
        {
          heading: 'What you need to get started',
          body: 'You only need two things: a photo of yourself where your face is clearly visible, and internet access. No additional apps, no account, no credit card. MakeSkins works directly in your browser on mobile or desktop.',
        },
        {
          heading: 'How MakeSkins works: step by step',
          body: '1. Upload your photo — choose a front-facing, well-lit photo where your face fills most of the frame.\n2. Adjust the crop — center your face in the box for the most accurate result.\n3. Generate your skin — in seconds you get a 64×64 pixel PNG with your face in Minecraft style.\n4. Download and install — download the file and upload it to the Minecraft launcher or minecraft.net.',
        },
        {
          heading: 'Tips for a better result',
          body: 'Skin quality depends directly on your photo. For best results, use a front-facing photo with good natural lighting (next to a window is perfect). Avoid photos with sunglasses, hats, or poor lighting. The more your face fills the frame, the more detail your character will have. If you\'re not happy with the result, you can use MakeSkins\' pixel editor to manually adjust any detail.',
        },
        {
          heading: 'Which Minecraft versions are compatible?',
          body: 'The skin generated by MakeSkins is a 64×64 pixel PNG compatible with all Minecraft versions: Java Edition (PC/Mac), Bedrock Edition (Windows, Xbox, PlayStation, Nintendo Switch, and mobile). One skin works across all your devices.',
        },
      ],
      fr: [
        {
          heading: 'Pourquoi avoir un skin personnalisé ?',
          body: 'Sur les serveurs multijoueurs, tous les joueurs commencent avec le même look : Steve ou Alex. Un skin personnalisé te démarque, te donne une identité et permet à tes amis de te reconnaître instantanément. Et si tu apparais en tant que toi-même, l\'expérience est bien plus amusante.',
        },
        {
          heading: 'Ce dont tu as besoin',
          body: 'Il te faut seulement deux choses : une photo de toi où ton visage est bien visible, et un accès internet. Pas d\'appli supplémentaire, pas de compte, pas de carte bancaire. MakeSkins fonctionne directement dans ton navigateur.',
        },
        {
          heading: 'Comment fonctionne MakeSkins : étape par étape',
          body: '1. Télécharge ta photo — choisis une photo de face, bien éclairée, où ton visage occupe la majeure partie du cadre.\n2. Ajuste le recadrage — centre ton visage pour un résultat optimal.\n3. Génère ton skin — en quelques secondes tu obtiens un PNG 64×64 pixels avec ton visage en style Minecraft.\n4. Télécharge et installe — importe le fichier dans le launcher Minecraft ou sur minecraft.net.',
        },
        {
          heading: 'Conseils pour un meilleur résultat',
          body: 'La qualité du skin dépend directement de ta photo. Pour de meilleurs résultats, utilise une photo de face avec un bon éclairage naturel. Évite les lunettes de soleil, les casquettes ou les photos sombres. Plus ton visage remplit le cadre, plus le personnage sera détaillé.',
        },
        {
          heading: 'Avec quelles versions de Minecraft est-il compatible ?',
          body: 'Le skin généré par MakeSkins est un PNG 64×64 pixels compatible avec toutes les versions de Minecraft : Java Edition, Bedrock Edition (Windows, Xbox, PlayStation, Nintendo Switch et mobile). Un seul skin fonctionne sur tous tes appareils.',
        },
      ],
      pt: [
        {
          heading: 'Porquê ter uma skin personalizada?',
          body: 'Nos servidores multijogador, todos os jogadores começam com o mesmo visual: Steve ou Alex. Uma skin personalizada diferencia-te, dá-te identidade e faz com que os teus amigos te reconheçam imediatamente.',
        },
        {
          heading: 'O que precisas para começar',
          body: 'Só precisas de duas coisas: uma foto tua onde o teu rosto esteja bem visível, e acesso à internet. Sem aplicações adicionais, sem conta, sem cartão de crédito. O MakeSkins funciona diretamente no browser do teu telemóvel ou computador.',
        },
        {
          heading: 'Como funciona o MakeSkins: passo a passo',
          body: '1. Carrega a tua foto — escolhe uma foto de frente, bem iluminada, onde o teu rosto ocupe a maior parte do enquadramento.\n2. Ajusta o recorte — centra o teu rosto para um resultado mais preciso.\n3. Gera a tua skin — em segundos obtens um PNG de 64×64 píxeis com o teu rosto em estilo Minecraft.\n4. Descarrega e instala — importa o ficheiro no launcher do Minecraft ou em minecraft.net.',
        },
        {
          heading: 'Dicas para um melhor resultado',
          body: 'A qualidade da skin depende diretamente da foto. Para melhores resultados, usa uma foto de frente com boa iluminação natural. Evita óculos de sol, bonés ou fotos escuras. Quanto mais o teu rosto preencher o enquadramento, mais detalhe terá o personagem.',
        },
        {
          heading: 'Com que versões do Minecraft é compatível?',
          body: 'A skin gerada pelo MakeSkins é um PNG de 64×64 píxeis compatível com todas as versões do Minecraft: Java Edition (PC/Mac), Bedrock Edition (Windows, Xbox, PlayStation, Nintendo Switch e telemóvel). Uma só skin funciona em todos os teus dispositivos.',
        },
      ],
    },
    cta: {
      es: { title: '¿Listo para crear tu skin?', btn: 'Crear mi skin gratis →' },
      en: { title: 'Ready to create your skin?', btn: 'Create my skin for free →' },
      fr: { title: 'Prêt à créer ton skin ?', btn: 'Créer mon skin gratuitement →' },
      pt: { title: 'Pronto para criar a tua skin?', btn: 'Criar a minha skin grátis →' },
    },
  },

  {
    slug: 'mejores-skins-minecraft-superheroes',
    date: '2026-06-03',
    coverEmoji: '🦸',
    category: { es: 'Galería', en: 'Gallery', fr: 'Galerie', pt: 'Galeria' },
    title: {
      es: 'Las mejores skins de Minecraft de superhéroes para descargar gratis',
      en: 'Best free Minecraft superhero skins to download',
      fr: 'Les meilleurs skins Minecraft de super-héros à télécharger gratuitement',
      pt: 'As melhores skins de Minecraft de super-heróis para descarregar grátis',
    },
    description: {
      es: 'Spider-Man, Batman, Iron Man, Hulk, Captain America y más. Descarga gratis las mejores skins de superhéroes para Minecraft, compatibles con Java y Bedrock.',
      en: 'Spider-Man, Batman, Iron Man, Hulk, Captain America and more. Download the best free superhero skins for Minecraft, compatible with Java and Bedrock.',
      fr: 'Spider-Man, Batman, Iron Man, Hulk, Captain America et plus. Télécharge les meilleurs skins de super-héros pour Minecraft, compatibles Java et Bedrock.',
      pt: 'Spider-Man, Batman, Iron Man, Hulk, Capitão América e mais. Descarrega as melhores skins de super-heróis para Minecraft, compatíveis com Java e Bedrock.',
    },
    metaTitle: {
      es: 'Las mejores skins de Minecraft de superhéroes (gratis) – MakeSkins',
      en: 'Best free Minecraft superhero skins – MakeSkins',
      fr: 'Meilleurs skins Minecraft de super-héros gratuits – MakeSkins',
      pt: 'Melhores skins de Minecraft de super-heróis grátis – MakeSkins',
    },
    metaDesc: {
      es: 'Descarga gratis skins de Minecraft de Spider-Man, Batman, Iron Man, Hulk, Naruto, Sonic y más. Compatible con Java Edition y Bedrock Edition.',
      en: 'Download free Minecraft skins of Spider-Man, Batman, Iron Man, Hulk, Naruto, Sonic and more. Compatible with Java Edition and Bedrock Edition.',
      fr: 'Télécharge gratuitement des skins Minecraft de Spider-Man, Batman, Iron Man, Hulk, Naruto, Sonic et plus. Compatibles Java et Bedrock.',
      pt: 'Descarrega skins grátis do Minecraft de Spider-Man, Batman, Iron Man, Hulk, Naruto, Sonic e mais. Compatíveis com Java e Bedrock.',
    },
    intro: {
      es: 'Los superhéroes son, junto con los personajes de anime y los iconos del videojuego, los skins más buscados en Minecraft. Si quieres jugar como Spider-Man, Batman o Iron Man, tienes suerte: en MakeSkins puedes descargar todas estas skins completamente gratis, listas para usar en Java Edition y Bedrock Edition.',
      en: 'Superheroes are, along with anime characters and video game icons, the most searched skins in Minecraft. If you want to play as Spider-Man, Batman or Iron Man, you\'re in luck: at MakeSkins you can download all these skins completely free, ready to use in Java Edition and Bedrock Edition.',
      fr: 'Les super-héros sont, avec les personnages d\'anime et les icônes de jeux vidéo, les skins les plus recherchés sur Minecraft. Si tu veux jouer en Spider-Man, Batman ou Iron Man, tu as de la chance : sur MakeSkins, tu peux télécharger tous ces skins gratuitement.',
      pt: 'Os super-heróis são, juntamente com os personagens de anime e os ícones de videojogos, as skins mais procuradas no Minecraft. Se queres jogar como Spider-Man, Batman ou Iron Man, tens sorte: no MakeSkins podes descarregar todas estas skins completamente grátis.',
    },
    sections: {
      es: [
        {
          heading: 'Spider-Man — El favorito de los servidores',
          body: 'La skin de Spider-Man para Minecraft es, con diferencia, la más solicitada en los servidores PvP. El diseño de MakeSkins incluye el traje rojo y azul clásico con máscara completa y los ojos blancos en forma de lágrima que caracterizan al personaje. Compatible con el modelo Steve.',
        },
        {
          heading: 'Batman — El Caballero Oscuro en el mundo cúbico',
          body: 'El Caballero Oscuro tiene un look impresionante en Minecraft. La skin incluye la armadura gris oscura, la capa negra, la capucha con orejas puntiagudas y el icónico emblema del murciélago en el pecho. Perfecta para partidas nocturnas o en el Nether.',
        },
        {
          heading: 'Iron Man — Tecnología en píxeles',
          body: 'La suit del hombre de hierro se traduce perfectamente al estilo blocky de Minecraft. El diseño incluye la armadura roja y dorada con el arc reactor brillando en el pecho y la ranura característica del casco. Una de las skins más reconocibles de nuestra galería.',
        },
        {
          heading: 'Hulk — Fuerza bruta de píxeles',
          body: 'El gigante verde de Marvel tiene una presencia imponente en cualquier servidor. La skin de Hulk incluye los pantalones morados rotos, la musculatura verde y una expresión de furia característica con cejas caídas. Ideal para modos de combate.',
        },
        {
          heading: 'Captain America, Naruto, Sonic y mucho más',
          body: 'La galería de MakeSkins incluye también al Capitán América (con su escudo), Naruto Uzumaki (con su bandana y marcas de bigote), Sonic (con sus ojos verdes característicos), Master Chief de Halo, y muchos más personajes de cultura pop. Todas las skins son de descarga gratuita y listas para usar.',
        },
        {
          heading: '¿Cómo descargar e instalar estas skins?',
          body: 'Ve a la galería de MakeSkins, elige tu skin favorita y pulsa "Descargar". Luego sigue nuestra guía de instalación según tu plataforma: Java Edition, Bedrock (Windows), Xbox, PlayStation, Nintendo Switch o móvil. El proceso tarda menos de 2 minutos.',
        },
      ],
      en: [
        {
          heading: 'Spider-Man — The server favourite',
          body: 'The Spider-Man skin for Minecraft is, by far, the most requested on PvP servers. The MakeSkins design includes the classic red and blue suit with full mask and the teardrop-shaped white eyes that characterize the character. Compatible with the Steve model.',
        },
        {
          heading: 'Batman — The Dark Knight in cubic world',
          body: 'The Dark Knight looks impressive in Minecraft. The skin includes the dark grey armour, black cape, pointed-ear hood and the iconic bat emblem on the chest. Perfect for night sessions or in the Nether.',
        },
        {
          heading: 'Iron Man — Technology in pixels',
          body: 'Iron Man\'s suit translates perfectly to Minecraft\'s blocky style. The design includes the red and gold armour with the arc reactor glowing on the chest and the characteristic visor slot. One of the most recognisable skins in our gallery.',
        },
        {
          heading: 'Hulk — Brute force in pixels',
          body: 'Marvel\'s green giant has an imposing presence on any server. The Hulk skin features torn purple pants, green musculature and a characteristic fury expression with heavy brows. Ideal for combat modes.',
        },
        {
          heading: 'Captain America, Naruto, Sonic and much more',
          body: 'The MakeSkins gallery also includes Captain America (with his shield), Naruto Uzumaki (with headband and whisker marks), Sonic (with his distinctive green eyes), Master Chief from Halo, and many more pop culture characters. All skins are free to download and ready to use.',
        },
        {
          heading: 'How to download and install these skins?',
          body: 'Go to the MakeSkins gallery, choose your favourite skin and click "Download". Then follow our installation guide for your platform: Java Edition, Bedrock (Windows), Xbox, PlayStation, Nintendo Switch or mobile. The process takes less than 2 minutes.',
        },
      ],
      fr: [
        {
          heading: 'Spider-Man — Le préféré des serveurs',
          body: 'Le skin Spider-Man pour Minecraft est, de loin, le plus demandé sur les serveurs PvP. Le design MakeSkins inclut la tenue rouge et bleue classique avec masque complet et les yeux blancs en forme de larme. Compatible avec le modèle Steve.',
        },
        {
          heading: 'Batman — Le Chevalier Noir en monde cubique',
          body: 'Le Chevalier Noir est impressionnant dans Minecraft. Le skin inclut l\'armure gris foncé, la cape noire, le capuchon avec oreilles pointues et l\'emblème chauve-souris iconique sur la poitrine.',
        },
        {
          heading: 'Iron Man, Hulk, Captain America et bien plus',
          body: 'Notre galerie propose aussi Iron Man (armure rouge et or avec arc reactor), Hulk (pantalon violet déchiré et musculature verte), Captain America (avec son bouclier), Naruto (avec son bandeau et ses marques de moustache), Sonic (avec ses yeux verts), Master Chief de Halo et bien d\'autres. Tous les skins sont gratuits.',
        },
        {
          heading: 'Comment télécharger et installer ces skins ?',
          body: 'Va dans la galerie MakeSkins, choisis ton skin préféré et clique sur "Télécharger". Ensuite, suis notre guide d\'installation selon ta plateforme : Java Edition, Bedrock (Windows), Xbox, PlayStation, Nintendo Switch ou mobile.',
        },
      ],
      pt: [
        {
          heading: 'Spider-Man — O favorito dos servidores',
          body: 'A skin do Spider-Man para Minecraft é, de longe, a mais pedida nos servidores PvP. O design do MakeSkins inclui o fato vermelho e azul clássico com máscara completa e os olhos brancos em forma de lágrima. Compatível com o modelo Steve.',
        },
        {
          heading: 'Batman — O Cavaleiro das Trevas no mundo cúbico',
          body: 'O Cavaleiro das Trevas fica impressionante no Minecraft. A skin inclui a armadura cinzenta escura, a capa preta, o capuz com orelhas pontiagudas e o icónico emblema do morcego no peito.',
        },
        {
          heading: 'Iron Man, Hulk, Capitão América e muito mais',
          body: 'A nossa galeria também tem Iron Man (armadura vermelha e dourada com arc reactor), Hulk (calças roxas rasgadas e musculatura verde), Capitão América (com o escudo), Naruto (com a faixa e marcas de bigode), Sonic (com os olhos verdes), Master Chief do Halo e muitos mais. Todas as skins são gratuitas.',
        },
        {
          heading: 'Como descarregar e instalar estas skins?',
          body: 'Vai à galeria do MakeSkins, escolhe a tua skin favorita e clica em "Descarregar". Depois segue o nosso guia de instalação para a tua plataforma: Java Edition, Bedrock (Windows), Xbox, PlayStation, Nintendo Switch ou telemóvel.',
        },
      ],
    },
    cta: {
      es: { title: 'O crea la tuya propia desde tu foto', btn: 'Crear skin personalizada →' },
      en: { title: 'Or create your own from your photo', btn: 'Create custom skin →' },
      fr: { title: 'Ou crée le tien depuis ta photo', btn: 'Créer mon skin personnalisé →' },
      pt: { title: 'Ou cria a tua própria a partir da tua foto', btn: 'Criar skin personalizada →' },
    },
  },

  {
    slug: 'minecraft-java-vs-bedrock-skins',
    date: '2026-06-05',
    coverEmoji: '⚔️',
    category: { es: 'Guía', en: 'Guide', fr: 'Guide', pt: 'Guia' },
    title: {
      es: 'Skins en Minecraft Java vs Bedrock: diferencias y compatibilidad',
      en: 'Minecraft Java vs Bedrock skins: differences and compatibility',
      fr: 'Skins Minecraft Java vs Bedrock : différences et compatibilité',
      pt: 'Skins no Minecraft Java vs Bedrock: diferenças e compatibilidade',
    },
    description: {
      es: '¿Las skins de Minecraft son iguales en Java y Bedrock? Descubre las diferencias, qué formatos son compatibles y cómo usar la misma skin en todas tus plataformas.',
      en: 'Are Minecraft skins the same in Java and Bedrock? Discover the differences, which formats are compatible, and how to use the same skin across all your platforms.',
      fr: 'Les skins Minecraft sont-ils les mêmes en Java et Bedrock ? Découvre les différences, les formats compatibles et comment utiliser le même skin sur toutes tes plateformes.',
      pt: 'As skins do Minecraft são iguais no Java e no Bedrock? Descobre as diferenças, os formatos compatíveis e como usar a mesma skin em todas as tuas plataformas.',
    },
    metaTitle: {
      es: 'Skins Minecraft Java vs Bedrock: diferencias y compatibilidad – MakeSkins',
      en: 'Minecraft Java vs Bedrock skins: differences and compatibility – MakeSkins',
      fr: 'Skins Minecraft Java vs Bedrock : différences – MakeSkins',
      pt: 'Skins Minecraft Java vs Bedrock: diferenças – MakeSkins',
    },
    metaDesc: {
      es: 'Guía completa sobre las diferencias de skins entre Minecraft Java Edition y Bedrock Edition. Formatos, modelos Steve/Alex y cómo instalar la misma skin en todas las plataformas.',
      en: 'Complete guide on skin differences between Minecraft Java Edition and Bedrock Edition. Formats, Steve/Alex models and how to install the same skin on all platforms.',
      fr: 'Guide complet sur les différences de skins entre Minecraft Java Edition et Bedrock Edition. Formats, modèles Steve/Alex et installation sur toutes les plateformes.',
      pt: 'Guia completo sobre as diferenças de skins entre Minecraft Java Edition e Bedrock Edition. Formatos, modelos Steve/Alex e instalação em todas as plataformas.',
    },
    intro: {
      es: 'Minecraft existe en dos grandes versiones: Java Edition (la original, para PC y Mac) y Bedrock Edition (para Windows, consolas y móvil). Aunque el juego es esencialmente el mismo, existen diferencias importantes a la hora de usar skins. Si tienes varias plataformas o te preguntas por qué una skin no te funciona en cierta versión, esta guía te lo explica todo.',
      en: 'Minecraft exists in two major versions: Java Edition (the original, for PC and Mac) and Bedrock Edition (for Windows, consoles and mobile). Although the game is essentially the same, there are important differences when it comes to using skins. If you have multiple platforms or wonder why a skin doesn\'t work on a certain version, this guide explains everything.',
      fr: 'Minecraft existe en deux grandes versions : Java Edition (l\'originale, pour PC et Mac) et Bedrock Edition (pour Windows, consoles et mobile). Bien que le jeu soit essentiellement le même, il existe des différences importantes concernant les skins. Si tu as plusieurs plateformes ou te demandes pourquoi un skin ne fonctionne pas sur une certaine version, ce guide t\'explique tout.',
      pt: 'O Minecraft existe em duas grandes versões: Java Edition (a original, para PC e Mac) e Bedrock Edition (para Windows, consolas e telemóvel). Embora o jogo seja essencialmente o mesmo, existem diferenças importantes no que diz respeito às skins. Se tens várias plataformas ou te perguntas por que uma skin não funciona numa certa versão, este guia explica tudo.',
    },
    sections: {
      es: [
        {
          heading: 'El formato es el mismo: PNG de 64×64',
          body: 'La buena noticia es que el formato básico de la skin es idéntico en ambas versiones: un archivo PNG de 64×64 píxeles con un mapa UV específico que cubre cabeza, tronco, brazos y piernas del personaje. Esto significa que una skin creada para Java funciona en Bedrock y viceversa, siempre que el modelo sea compatible.',
        },
        {
          heading: 'Los modelos de personaje: Steve vs Alex',
          body: 'Aquí está la diferencia más práctica. Minecraft tiene dos modelos de cuerpo:\n• Steve: brazos de 4 píxeles de grosor (el modelo clásico)\n• Alex: brazos de 3 píxeles de grosor (ligeramente más delgados)\nEn Java Edition, puedes usar cualquiera de los dos. En Bedrock Edition también, pero al subir la skin tienes que especificar cuál usas. Las skins de MakeSkins funcionan perfectamente con ambos modelos.',
        },
        {
          heading: 'Diferencia principal: cómo se instalan',
          body: 'En Java Edition, las skins se gestionan desde el Minecraft Launcher — puedes tener varias guardadas y cambiar entre ellas fácilmente. En Bedrock Edition, el proceso es diferente: vas al menú de perfil dentro del juego o a minecraft.net, y la skin queda vinculada a tu cuenta de Microsoft, sincronizándose en todos tus dispositivos Bedrock automáticamente.',
        },
        {
          heading: '¿Puedo usar la misma skin en Java y Bedrock?',
          body: 'Sí, pero tienes que subirla por separado en cada versión. Java no usa la misma base de datos que Bedrock — son sistemas independientes. Sin embargo, el archivo PNG es exactamente el mismo, así que descargas tu skin de MakeSkins una vez y la subes en Java y en Bedrock por separado.',
        },
        {
          heading: 'Bedrock: una skin para todas las plataformas',
          body: 'Una ventaja importante de Bedrock es que al estar vinculada a tu cuenta de Microsoft, la misma skin aparece automáticamente en Xbox, PlayStation, Nintendo Switch, Windows y móvil. Solo tienes que subirla una vez en minecraft.net o desde cualquier dispositivo Bedrock. Consulta nuestras guías de instalación para cada plataforma si necesitas ayuda.',
        },
      ],
      en: [
        {
          heading: 'The format is the same: 64×64 PNG',
          body: 'The good news is that the basic skin format is identical in both versions: a 64×64 pixel PNG file with a specific UV map covering the head, torso, arms and legs. This means a skin created for Java works on Bedrock and vice versa, as long as the model is compatible.',
        },
        {
          heading: 'Character models: Steve vs Alex',
          body: 'This is the most practical difference. Minecraft has two body models:\n• Steve: 4-pixel thick arms (the classic model)\n• Alex: 3-pixel thick arms (slightly slimmer)\nIn Java Edition you can use either. In Bedrock Edition too, but when uploading the skin you need to specify which one. MakeSkins skins work perfectly with both models.',
        },
        {
          heading: 'Main difference: how they are installed',
          body: 'In Java Edition, skins are managed from the Minecraft Launcher — you can have several saved and switch between them easily. In Bedrock Edition, the process is different: you go to the profile menu inside the game or minecraft.net, and the skin is linked to your Microsoft account, syncing across all your Bedrock devices automatically.',
        },
        {
          heading: 'Can I use the same skin in Java and Bedrock?',
          body: 'Yes, but you need to upload it separately to each version. Java doesn\'t use the same database as Bedrock — they are independent systems. However, the PNG file is exactly the same, so download your skin from MakeSkins once and upload it to both Java and Bedrock separately.',
        },
        {
          heading: 'Bedrock: one skin for all platforms',
          body: 'An important advantage of Bedrock is that since it\'s linked to your Microsoft account, the same skin automatically appears on Xbox, PlayStation, Nintendo Switch, Windows and mobile. You only need to upload it once at minecraft.net or from any Bedrock device. Check our installation guides for each platform if you need help.',
        },
      ],
      fr: [
        {
          heading: 'Le format est le même : PNG 64×64',
          body: 'La bonne nouvelle est que le format de base du skin est identique dans les deux versions : un fichier PNG 64×64 pixels avec une carte UV spécifique couvrant tête, torse, bras et jambes. Un skin créé pour Java fonctionne sur Bedrock et vice versa.',
        },
        {
          heading: 'Modèles de personnage : Steve vs Alex',
          body: 'C\'est la différence la plus pratique. Minecraft a deux modèles de corps :\n• Steve : bras de 4 pixels d\'épaisseur (le modèle classique)\n• Alex : bras de 3 pixels d\'épaisseur (légèrement plus fins)\nEn Java Edition, tu peux utiliser les deux. En Bedrock aussi, mais en important le skin tu dois préciser lequel. Les skins MakeSkins fonctionnent parfaitement avec les deux modèles.',
        },
        {
          heading: 'Différence principale : comment les installer',
          body: 'En Java Edition, les skins se gèrent depuis le Minecraft Launcher. En Bedrock Edition, le skin est lié à ton compte Microsoft et se synchronise sur tous tes appareils Bedrock automatiquement (Xbox, PlayStation, Switch, Windows, mobile).',
        },
        {
          heading: 'Puis-je utiliser le même skin en Java et Bedrock ?',
          body: 'Oui, mais tu dois l\'importer séparément dans chaque version. Le fichier PNG est exactement le même : télécharge ton skin depuis MakeSkins une seule fois et importe-le dans Java et Bedrock séparément.',
        },
      ],
      pt: [
        {
          heading: 'O formato é o mesmo: PNG de 64×64',
          body: 'A boa notícia é que o formato básico da skin é idêntico nas duas versões: um ficheiro PNG de 64×64 píxeis com um mapa UV específico. Uma skin criada para Java funciona no Bedrock e vice-versa.',
        },
        {
          heading: 'Modelos de personagem: Steve vs Alex',
          body: 'Esta é a diferença mais prática. O Minecraft tem dois modelos de corpo:\n• Steve: braços com 4 píxeis de espessura (o modelo clássico)\n• Alex: braços com 3 píxeis de espessura (ligeiramente mais finos)\nTanto no Java como no Bedrock podes usar qualquer um. As skins do MakeSkins funcionam perfeitamente com ambos os modelos.',
        },
        {
          heading: 'Diferença principal: como se instalam',
          body: 'No Java Edition, as skins são geridas pelo Minecraft Launcher. No Bedrock Edition, a skin fica ligada à tua conta Microsoft e sincroniza automaticamente em todos os teus dispositivos Bedrock (Xbox, PlayStation, Switch, Windows, telemóvel).',
        },
        {
          heading: 'Posso usar a mesma skin no Java e no Bedrock?',
          body: 'Sim, mas tens de a carregar separadamente em cada versão. O ficheiro PNG é exatamente o mesmo: descarrega a tua skin do MakeSkins uma vez e carrega-a no Java e no Bedrock separadamente.',
        },
      ],
    },
    cta: {
      es: { title: 'Crea tu skin compatible con todas las plataformas', btn: 'Crear mi skin gratis →' },
      en: { title: 'Create your skin compatible with all platforms', btn: 'Create my skin for free →' },
      fr: { title: 'Crée ton skin compatible avec toutes les plateformes', btn: 'Créer mon skin gratuitement →' },
      pt: { title: 'Cria a tua skin compatível com todas as plataformas', btn: 'Criar a minha skin grátis →' },
    },
  },
]

export const BLOG_INDEX_META: Record<Locale, { title: string; subtitle: string; metaTitle: string; metaDesc: string }> = {
  es: {
    metaTitle: 'Blog de Minecraft: guías, skins y tutoriales – MakeSkins',
    metaDesc: 'Tutoriales, guías y artículos sobre Minecraft: cómo crear skins, diferencias Java vs Bedrock, mejores skins de superhéroes y mucho más.',
    title: 'Blog',
    subtitle: 'Guías, tutoriales y todo sobre skins de Minecraft',
  },
  en: {
    metaTitle: 'Minecraft Blog: guides, skins and tutorials – MakeSkins',
    metaDesc: 'Tutorials, guides and articles about Minecraft: how to create skins, Java vs Bedrock differences, best superhero skins and much more.',
    title: 'Blog',
    subtitle: 'Guides, tutorials and everything about Minecraft skins',
  },
  fr: {
    metaTitle: 'Blog Minecraft : guides, skins et tutoriels – MakeSkins',
    metaDesc: 'Tutoriels, guides et articles sur Minecraft : comment créer des skins, différences Java vs Bedrock, meilleurs skins de super-héros et plus.',
    title: 'Blog',
    subtitle: 'Guides, tutoriels et tout sur les skins Minecraft',
  },
  pt: {
    metaTitle: 'Blog de Minecraft: guias, skins e tutoriais – MakeSkins',
    metaDesc: 'Tutoriais, guias e artigos sobre Minecraft: como criar skins, diferenças Java vs Bedrock, melhores skins de super-heróis e muito mais.',
    title: 'Blog',
    subtitle: 'Guias, tutoriais e tudo sobre skins do Minecraft',
  },
}
