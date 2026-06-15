// Cola de posts para Reddit — rotan automáticamente
// Subreddits objetivo: r/Minecraft (8M), r/MinecraftSkins (400K), r/gaming (36M)

export interface RedditPost {
  subreddit: string
  title:     string
  text:      string
  type:      'text' | 'link'
  url?:      string
  flair?:    string
}

export const REDDIT_QUEUE: RedditPost[] = [
  {
    subreddit: 'MinecraftSkins',
    type:      'text',
    title:     'Built a free tool that converts your selfie into a Minecraft skin — no account needed',
    text:      `Hey everyone! I've been working on a free web tool called MakeSkins that automatically converts a face photo into a proper 64×64 Minecraft skin.\n\nHow it works:\n- Upload any photo (selfie works best)\n- Adjust the crop so your face fills the frame\n- Download the PNG — ready for Java or Bedrock\n\nNo account, no download, works on mobile too. There's also a pixel editor if you want to tweak the result manually.\n\nhttps://makeskins.com\n\nFeedback welcome — still improving the face detection algorithm!`,
  },
  {
    subreddit: 'Minecraft',
    type:      'text',
    flair:     'Discussion',
    title:     'PSA: You can turn your actual face into a Minecraft skin for free in about 60 seconds',
    text:      `Not sure how many people know this but there's a free tool (makeskins.com) that does exactly what it sounds like — upload a photo, it maps your face onto a proper Minecraft skin template.\n\nI've been using it on my server and it's hilarious/great to recognize friends by their actual faces. Works for Java and Bedrock, downloads as a standard 64×64 PNG.\n\nNo sign-up required. Thought some of you might find it useful!`,
  },
  {
    subreddit: 'MinecraftSkins',
    type:      'text',
    title:     'Free superhero skin pack: Spider-Man, Batman, Iron Man, Hulk, Naruto, Sonic + more (Java & Bedrock)',
    text:      `I put together a gallery of 26 free-to-download character skins — all hand-crafted with proper pixel shading:\n\n🦸 Spider-Man, Batman, Iron Man, Hulk, Captain America\n🍥 Naruto, Sonic\n🎮 Master Chief (Halo)\n+ ninja, samurai, astronaut and more classic designs\n\nAll 64×64 PNG format, compatible with both Java and Bedrock. Free download, no account needed.\n\n→ https://makeskins.com/en/gallery\n\nLet me know if there's a character you'd like added to the collection!`,
  },
  {
    subreddit: 'Minecraft',
    type:      'text',
    flair:     'Guide',
    title:     'How to install a custom skin on every platform (Java, Bedrock, Xbox, PS5, Switch, Mobile) — quick guide',
    text:      `A lot of people ask about this so here's a quick summary:\n\n**Java Edition (PC/Mac):**\nMinecraft Launcher → Skins tab → + → Browse → select PNG → Use\n\n**Bedrock (Windows/Xbox/PS/Switch/Mobile):**\nAll Bedrock devices sync through your Microsoft account. Just go to minecraft.net → Profile → Change Appearance → Upload skin → Save. It syncs everywhere automatically.\n\n**Mobile (iOS/Android):**\nSettings → Profile → Edit character → Classic Skins → Choose file → your downloaded PNG\n\nIf you need a skin to test this with, https://makeskins.com has free downloads (or make one from your photo).\n\nHope this helps!`,
  },
  {
    subreddit: 'MinecraftSkins',
    type:      'text',
    title:     'Tool that auto-generates Minecraft skins from photos — updated with better face mapping',
    text:      `Just pushed some improvements to the face detection on MakeSkins (makeskins.com).\n\nThe tool takes any face photo and converts it into a proper Minecraft skin:\n- Cylindrical shading on arms/legs/head for 3D depth\n- Supports Steve and Alex models\n- Built-in pixel editor for manual touch-ups\n- Download as 64×64 PNG (Java + Bedrock compatible)\n\nStill completely free. Would love feedback on edge cases — what photos give you the worst results?`,
  },
  {
    subreddit: 'Minecraft',
    type:      'text',
    flair:     'Discussion',
    title:     'What skin do you use and why? (also found a cool free skin maker)',
    text:      `Curious what everyone's using for their Minecraft skin and what made you choose it.\n\nPersonally been using a skin of my own face made with https://makeskins.com — it's a free tool that converts a selfie into a proper Minecraft character. Kind of surreal mining for diamonds as yourself lol.\n\nAlso has a bunch of premade character skins (Spider-Man, Batman, Naruto etc.) if you just want something cool without the photo process.\n\nDrop your skin choices below!`,
  },
]

// Devuelve el post que toca según la semana del año (rota el ciclo)
export function getPostForWeek(weekIndex: number): RedditPost {
  return REDDIT_QUEUE[weekIndex % REDDIT_QUEUE.length]
}

// Número de semana del año
export function getWeekNumber(date = new Date()): number {
  const start = new Date(date.getFullYear(), 0, 1)
  return Math.floor((date.getTime() - start.getTime()) / 604800000)
}
