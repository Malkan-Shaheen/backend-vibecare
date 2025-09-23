// scripts/insertImages.js
const mongoose = require('mongoose');
const Image = require('../models/Images'); 

const images = [
  {
    _id: new mongoose.Types.ObjectId(),
    imageUrl: "https://res.cloudinary.com/dpz3d1cif/image/upload/v1745741946/54_row6zo.jpg",
    options: [
      { label: " Full Face", personality: "You have a **creative spirit**. You think beyond the obvious and love ideas that combine imagination with deep meaning. You’re a **dreamer and a planner** at the same time." },
      { label: "Trees", personality: "Just like trees grow tall and strong over time, you believe in **slow but meaningful progress** — both personally and professionally" },
      { label: "Huts (Houses)", personality: "You value **security, family, and comfort**. You focus on building a strong foundation in life — a good career, home, and safe emotional spaces." }
    ]
  },
  {
    _id: new mongoose.Types.ObjectId(),
    imageUrl: "https://res.cloudinary.com/dpz3d1cif/image/upload/v1745741946/53_twwhck.jpg",
    options: [
      { label: " Birds  ", personality: "Birds symbolize **hope and aspirations**. You tend to **see the bright side** of things even when situations are tough, believing there’s always a way out." },
      { label: "Tree ", personality: "Trees shelter others. You have a **natural instinct to protect, care for, and support** those close to you, sometimes even at your own expense.      " },
      { label: "Hut", personality: "You respect **traditions, memories, and relationships**. You hold your commitments close and **prefer deep, lasting connections** over fleeting experiences." }
    ]
  },
  {
    _id: new mongoose.Types.ObjectId(),
    imageUrl: "https://res.cloudinary.com/dpz3d1cif/image/upload/v1745741932/1cc4d09a-7310-4802-bb59-25cca634da8d.png",
    options: [
      { label: "The Woman’s Tear-Streaked Face", personality: "You're emotionally intelligent and in tune with hidden feelings—your own and others'. You process the world through emotion before logic.You may be carrying or drawn to pain, resilience, or stories of survival. You feel deeply and seek meaning in emotional experiences.You connect with expressive, raw, and powerful visuals. You likely love art that speaks of struggle, beauty, and transformation through pain." },
      { label: "The Upside-Down Faces", personality: "You're introspective and perhaps a bit of a mystery—even to yourself. You’re drawn to what’s underneath, the hidden layers. You're fascinated by relationships, duality, and tension—love versus loss, intimacy versus identity. You're intrigued by illusion, depth, and dual-meaning artwork. You probably enjoy surrealism or abstract symbolism that challenges the eye and mind." },
      { label: "The Skull Illusion", personality: " You're a realist with a philosophical streak. Mortality, endings, and deeper truths don’t scare you—they fascinate you.You may appear emotionally composed, but you feel deeply. You often reflect on themes like time, existence, or transformation.You gravitate toward dark elegance, gothic or macabre art. You find beauty in decay, truth in darkness, and clarity in chaos." }
    ]
  },
  {
    _id: new mongoose.Types.ObjectId(),
    imageUrl: "https://res.cloudinary.com/dpz3d1cif/image/upload/v1745741743/981e314b-6bce-436f-a2c5-5bfaab8333a2.png",
    options: [
      { label: "WOMAN’S FACE", personality: "You’re emotional, artistic, and love beauty.You notice feelings, expressions, and deeper meanings quickly.You care about people and like things that are soulful or poetic. Sensitive, creative, and full of inner beauty." },
      { label: " FLOWERS", personality: "You’re joyful, gentle, and full of positive energy.You enjoy small happy things—like smiles, colors, or sunshine.You bring light and comfort to others.Kind, cheerful, and warm-hearted." },
      { label: " LEAVES/GREENERY", personality: "You’re peaceful, balanced, and calm.You focus on the environment and love being connected to nature.You like quiet spaces where you can think and relax.Grounded, thoughtful, and calming to be around." }
    ]
  },
  {
    _id: new mongoose.Types.ObjectId(),
    imageUrl: "https://res.cloudinary.com/dpz3d1cif/image/upload/v1745741738/94681c3e-34b6-4837-8c9b-541fabe0eda5.png",
    options: [
      { label: "SKULL", personality: "You’re deep, serious, and like thinking about life’s big questions.You might be more logical or realistic.You notice the whole picture right away.Wise, thoughtful, and maybe a little mysterious." },
      { label: "WOMAN AT THE VANITY ", personality: "You’re sensitive, emotional, and thoughtful.You focus on people, feelings, and daily moments.You pay attention to beauty, small details, and self-reflection.Gentle, caring, and emotionally aware." },
      { label: "ROOM / SETTING ", personality: "You’re observant, imaginative, and detail-loving.You look at everything before judging.You like stories, hidden meanings, and artistic things.Creative, curious, and open-minded." }
    ]
  },
  {
    _id: new mongoose.Types.ObjectId(),
    imageUrl: "https://res.cloudinary.com/dpz3d1cif/image/upload/v1745741732/886bc7ea-88ff-43d6-9a24-11a2f70bb0f3.png",
    options: [
      { label: "CROCODILE ", personality: "You’re bold and confident.You notice danger or big things fast.You like to stay in control and protect others. Strong, focused, and a natural leader." },
      { label: "BOAT with PEOPLE", personality: "You’re caring and thoughtful.You notice people and feelings before anything else.You think deeply and care about stories or emotions.Gentle, kind, and always thinking about others." },
      { label: "TEXTURE or FADED PART ", personality: "You’re curious and observant.You spot tiny details others miss.You like thinking and figuring things out quietly.Quiet thinker with a sharp mind." }
    ]
  },
  {
    _id: new mongoose.Types.ObjectId(),
    imageUrl: "https://res.cloudinary.com/dpz3d1cif/image/upload/v1745741720/d62270eb-8e52-47b9-917a-0dd610db1a34.png",
    options: [
      { label: "BEARS", personality: "You’re brave, strong, and protective.You focus on action and what’s really happening in the moment.You probably stand up for people and don’t back down easily.A natural protector, bold and dependable." },
      { label: "MOUNTAINS", personality: "You’re calm, grounded, and love peace.You like thinking things through and staying balanced.You enjoy nature, space, and quiet moments. Steady, thoughtful, and wise." },
      { label: "GRASS/land", personality: "You’re practical and down-to-earth.You pay attention to details and what supports everything else.You like comfort, warmth, and creating a cozy environment. Simple, caring, and humble with a good heart. " }
    ]
  },
  {
    _id: new mongoose.Types.ObjectId(),
    imageUrl: "https://res.cloudinary.com/dpz3d1cif/image/upload/v1745741702/bebbeef2-8a85-4bab-aad0-c60c24c4d1d9.png",
    options: [
      { label: "YOUNG WOMAN", personality: "You’re fun, curious, and full of energy.You focus on the bright side of things.You like meeting people, trying new stuff, and living in the moment.Happy, playful, and open to life." },
      { label: "OLDER MAN", personality: "You’re thoughtful, wise, and maybe a bit serious.You notice the deep stuff first.You like thinking things through and making smart choices.Calm, smart, and mature." },
      { label: "BOTH right away", personality: "You’re very sharp and open-minded.You like looking at things from different angles.You’re a mix of fun and deep thinking. Insightful, flexible, and creative." }
    ]
  },
  {
    _id: new mongoose.Types.ObjectId(),
    imageUrl: "https://res.cloudinary.com/dpz3d1cif/image/upload/v1745741690/6df35e30-8d35-45a8-af90-fa5ec5080ce2.png",
    options: [
      { label: "APPLE ", personality: "You're practical and down-to-earth.You like things that make sense and probably focus on what’s real and familiar. You’re the type who finishes what you start and doesn’t get lost in your head too much.You value stability and routine.You probably like planning things out.People might come to you when they need something done right.The reliable, no-nonsense thinker." },
      { label: "BUTTERFLY ", personality: "You're creative and deep.You notice beauty, symbols, or emotions before anything else. You probably think a lot about meaning and love expressing yourself in your own way.You’re full of imagination and empathy.You feel things deeply.You probably daydream more than average (and love it).The artistic soul and gentle dreamer." },
      { label: "KNIFE", personality: "You're sharp and observant.You catch the little details others miss. You like figuring things out, cutting through confusion, and getting straight to the point.You think quickly and act decisively.You’re curious and like to understand how things work.You probably don’t like sugar-coating stuff.The clever problem-solver with edge." }
    ]
  },
  {
    _id: new mongoose.Types.ObjectId(),
    imageUrl: "https://res.cloudinary.com/dpz3d1cif/image/upload/v1745741653/c481dc33-54d9-446f-810b-eae3a42bf480.png",
    options: [
      { label: "Whale", personality: "Whales are also seen as spiritual guides. You probably have strong intuition and a natural connection to the universe’s bigger flow, even if you don’t always realize it." },
      { label: "Surfer", personality: "You trust your instincts and don’t wait for permission to chase your dreams. You value personal freedom and sometimes prefer walking your own path.      " },
      { label: "Moon", personality: "The moon influences tides and emotions. You may be emotionally intuitive — you pick up on others' feelings easily, and your moods can shift like the lunar phases. " }
    ]
  },
  {
    _id: new mongoose.Types.ObjectId(),
    imageUrl: "https://res.cloudinary.com/dpz3d1cif/image/upload/v1745741630/a2621a96-53ba-4c40-94b1-c60fc16bb374.png",
    options: [
      { label: "Cat", personality: "You likely have a calm, independent, and observant personality.Thoughtful, self-aware, possibly introverted but confident in your own space. You prefer quiet strength over loud expression.You’re a keen observer who watches before acting. You may be selective in relationships but deeply loyal once trust is built." },
      { label: "Man's Face", personality: "You’re detail-oriented, possibly analytical, and good at spotting hidden meaning.Clever, perceptive, and curious. You enjoy puzzles, symbolism, and might excel at problem-solving or abstract thinking. You look beyond the obvious. You may be a natural at reading people or situations intuitively, often noticing what others miss." },
      { label: "Overall Design", personality: "You may be a creative, open-minded, and aesthetically-driven person.Artistic, imaginative, and expressive. You think outside the box and value originality and emotional expression. You enjoy variety and freedom. Your outlook on life is often colorful—sometimes unconventional, but always authentic." }
    ]
  },
  {
    _id: new mongoose.Types.ObjectId(),
    imageUrl: "https://res.cloudinary.com/dpz3d1cif/image/upload/v1745741601/02d56878-43e4-4a2e-bba3-2ba35da91a0f.png",
    options: [
      { label: "Face in the Cliff", personality: "You're a big-picture thinker who sees patterns and meanings in abstract places. Imaginative, intuitive, philosophical. You often look at life symbolically, perhaps reading deeper meaning into situations. You are someone who seeks to understand people and the world at a soul level. You can be reflective, with an eye for art, metaphor, or emotion beneath the surface." },
      { label: "Dog First ", personality: "You’re likely compassionate, observant, and sensitive to details and living beings. Caring, empathetic, and protective of loved ones. You may prioritize comfort, emotional connection, and loyalty. You tend to notice subtle things others overlook. You probably value emotional warmth, safety, and relationships." },
      { label: "Boat on the River ", personality: "You may have an adventurous soul, and are drawn to freedom, exploration, or solitude.Independent, curious, and calm under pressure. You might be someone who enjoys thinking deeply, especially when in motion or close to nature.You seek meaning through experience and movement. You might crave escape from routine and are happiest when on your own journey, physically or mentally.      " }
    ]
  },
  {
    _id: new mongoose.Types.ObjectId(),
    imageUrl: "https://res.cloudinary.com/dpz3d1cif/image/upload/v1745741596/5b2070a6-ba39-4678-9c39-b417fc0fdb5b.png",
    options: [
      { label: "the Skull", personality: "You likely have a realistic, analytical, or even philosophical mindset.Deep thinker, reflective, possibly a little introverted. You might be someone who contemplates the meaning behind things and can see the “bigger picture.”You’re not afraid of facing darker truths or uncomfortable realities and may have a mature outlook on life and death." },
      { label: "Woman at Her Vanity", personality: "You may be more detail-oriented and grounded in the present moment.Observant, practical, and perhaps focused on daily life, appearances, or social norms.You value routine and the tangible world around you. You might be someone who notices small details that others miss." },
      { label: "Mirror or Reflection as a Whole Scene", personality: "You might be highly imaginative, intuitive, and emotionally aware. Creative, abstract thinker, and in tune with symbolism or metaphor. You’re good at seeing how things connect and might often “read between the lines” in both images and situations." }
    ]
  },
  {
    _id: new mongoose.Types.ObjectId(),
    imageUrl: "https://res.cloudinary.com/dpz3d1cif/image/upload/v1745741575/8a428dd6-53c7-42ab-aaf4-aa688db90c18.png",
    options: [
      { label: "Woman’s Face", personality: "You're deeply connected with self-awareness and identity. You often reflect on purpose, existence, and internal emotions.You're calm under pressure, often the serene one in chaos. You carry quiet strength and may mask intense thoughts behind a composed exterior.You appreciate elegance and simplicity in complexity. You likely enjoy portraits, expressionism, or surrealism with a personal/emotive touch" },
      { label: "Hair transforming into branches and leaves", personality: "You're constantly evolving. Your mind is active, branching out in multiple directions. You likely think in abstract or layered ways.You might feel torn between stability and freedom—rooted but still yearning to grow outward or upward.Nature, growth, and transformation fascinate you. You’re imaginative and perhaps philosophical, seeing metaphors in everything." },
      { label: "Particles/leaves blowing away to the right", personality: "You're sensitive to change, endings, or the idea of time slipping away. You may be a deep thinker, contemplating impermanence or transcendence.You feel emotions intensely and are easily moved by beauty or sadness. There might be a touch of melancholy or longing in you.You're a dreamer and likely drawn to ethereal, symbolic, or abstract art. You enjoy expression that isn’t boxed in by reality." }
    ]
  },
  
  {
    _id: new mongoose.Types.ObjectId(),
    imageUrl: "https://res.cloudinary.com/dpz3d1cif/image/upload/v1745741559/d858edd8-adaf-4598-8199-6731b34c51df.png",
    options: [
      { label: "Tree Trunk and Roots", personality: "You're grounded, practical, and value stability. You see the roots of things—connections, foundations, and where everything begins.You may have a nurturing personality. You like to support others emotionally, as the hands appear to be holding the face gently, protectively. You interpret beauty in realism and are drawn to structure. You prefer art and meaning that is tangible and strong, like the tree." },
      { label: "Woman’s Face", personality: "You are introspective and value peace. You're likely a deep thinker who often reflects inwardly. You might be sensitive, empathetic, and drawn to emotional expressions—this face represents calm, dreams, and serenity. You see beauty in simplicity. You may be artistic or poetic, seeing the emotional story behind visual imagery." },
      { label: "Leaves and Branches", personality: "You’re imaginative and have a strong connection to nature or abstract ideas. You see growth, change, and complexity. You may have a curious spirit and are likely optimistic, always thinking of potential and evolution.You have a whimsical or unconventional side—where others see a tree, you see life, mind, and transformation" }
    ]
  },
  {
    _id: new mongoose.Types.ObjectId(),
    imageUrl: "https://res.cloudinary.com/dpz3d1cif/image/upload/v1745741548/78339201-75bc-4608-b93a-3e6ea3819c35.png",
    options: [
      { label: "A Screaming Face at the Top", personality: "You’re someone who wears your heart on your sleeve.You deeply feel not only your own emotions but those of others.Often, you seek connection, expression, and authenticity.You may struggle with emotional overwhelm but find strength in vulnerability.Seeing the screaming face first means you respond intensely to strong emotions, possibly your own or others’. You're emotionally tuned-in and empathetic." },
      { label: "The Crying Eye in the Center", personality: "You internalize your emotions and process things quietly.You may seem calm on the outside but feel deeply inside.You're intuitive and sensitive, often understanding pain others can’t see.You’re nurturing but may struggle to open up fully.Seeing the crying eye first suggests you’re reflective and emotionally aware, but tend to keep your struggles private." },
      { label: "Multiple Faces Forming a Single Head", personality: "You’re highly observant of complexity—internal or external.You may often feel like different parts of yourself are battling for space.You're introspective and constantly trying to “make sense” of emotions.You process life through thought first, emotions second.Seeing the whole composition (multiple faces as one) shows you view things from a layered, psychological perspective. You're often exploring identity, trauma, and meaning." }
    ]
  },
  {
    _id: new mongoose.Types.ObjectId(),
    imageUrl: "https://res.cloudinary.com/dpz3d1cif/image/upload/v1745741540/51742829-06e0-444b-9eb5-40131fba8c39.png",
    options: [
      { label: "The Monkey on a Tree", personality: "You are observant and notice movement and action quickly.You love freedom, discovery, and don’t like staying still for too long.Often spontaneous, you're full of life and creativity.Social, fun-loving, and quick to adapt to new environments.This indicates you're driven by curiosity and enjoy exploring both physically and mentally." },
      { label: "The Human Face in Profile", personality: "You notice subtle, abstract elements—suggesting deep thinking.You value meaning, often analyze situations before reacting.Creative and strategic, you're more inwardly focused and intuitive.Often seen as wise or philosophical.This implies you're someone who seeks purpose and depth in everything." },
      { label: "A Tree with Branches", personality: "You focus on structure, stability, and the “bigger framework.”You value balance, routines, and the natural order of things.Calm and grounded, you think before you act.Likely to be dependable and supportive in relationships.Seeing the tree first shows you're someone who pays attention to structure and prefers clarity over chaos." }
    ]
  },
  {
    _id: new mongoose.Types.ObjectId(),
    imageUrl: "https://res.cloudinary.com/dpz3d1cif/image/upload/v1745741516/0404a577-0ec9-43cf-996e-0c74f5cc32e7.png",
    options: [
      { label: " Elephant ", personality: "Wise, thoughtful, and deeply empathetic .Thinks long-term and values inner peace. Prefers stability, tradition, and meaningful connections" },
      { label: "Horse", personality: "Independent, wild at heart, and loves freedomThrives in open spaces (mentally and physically)Has a strong desire for adventure and change" },
      { label: "Dog", personality: "Sensing, Feeling, Judging)Loyal, friendly, and dependableStrong sense of duty and responsibilityEnjoys helping others and values harmony" }
    ]
  },
  {
    _id: new mongoose.Types.ObjectId(),
    imageUrl: "https://res.cloudinary.com/dpz3d1cif/image/upload/v1745741513/95582c40-eb66-4f1d-b6bb-f1b9f307a81c.png",
    options: [
      { label: "Color contrast (cyan and magenta", personality: "You're likely a creative soul, sensitive to aesthetic beauty and artistic energy. You might be someone who sees life in layers and embraces contrast and complexity. You have a rich inner world, and duality doesn’t scare you — it fascinates you. You're probably introspective, often torn between emotions, yet find inspiration in it. You see beauty in chaos." },
      { label: "Overlapping heads/face", personality: "YYou may be someone who’s often in deep thought or internal conflict. This perspective suggests self-reflection, identity exploration, or maybe even emotional duality. You likely have a thoughtful, psychological side — you’re the type to pause, analyze, and wonder about the “different versions” of yourself. You value self-growth and are aware that humans are not just one thing — we're a blend of layers." },
      { label: "Facial expression", personality: "You’re probably emotionally intuitive, sensitive to vibes, moods, and body language. You might connect with people through empathy rather than words. You feel things deeply and often carry emotions that aren't even yours. This could also indicate you're someone who seeks peace, closure, or emotional stillness amid the noise of life. You might be introverted or value meaningful silence." }
    ]
  },
  {
    _id: new mongoose.Types.ObjectId(),
    imageUrl: "https://res.cloudinary.com/dpz3d1cif/image/upload/v1745741505/50ca7d56-6fd6-43b0-a2c1-2b612de4edcd.png",
    options: [
      { label: "Hug between the woman and the figure", personality: "You’re emotionally intelligent, empathetic, and deeply connected to the people around you. You value comfort, support, and intimacy — you may be someone others turn to when they’re feeling low. You're likely in touch with your own emotions and not afraid of vulnerability. You believe in the healing power of connection." },
      { label: "Figure made of words ", personality: "You're a thinker, a lover of words, or someone deeply moved by literature, ideas, or memories. You may often dwell in thought, perhaps even overthink at times. You’re reflective and feel that emotions and experiences can be captured and preserved through words. You may also be nostalgic, longing for someone or something that once existed. For you, words aren't just communication — they are presence." },
      { label: "Background text", personality: "You seek to understand the why behind things and may spend time contemplating or processing experiences through writing, journaling, or thinking deeply. You may find beauty in chaos, and your mind works like a tapestry of stories, feelings, and meanings." }
    ]
  },
  {
    _id: new mongoose.Types.ObjectId(),
    imageUrl: "https://res.cloudinary.com/dpz3d1cif/image/upload/v1745741483/f460831b-588f-4252-8f1c-7f106eb866fa.png",
    options: [
      { label: "person in a hat with binoculars", personality: "You are curious, observant, and likely enjoy uncovering hidden truths. You may be analytical and prefer to look deeper before forming opinions. There's a natural instinct in you to protect, investigate, or solve problems — a thinker, maybe even a bit secretiv" },
      { label: "letter A first", personality: "You are goal-driven, focused, and possibly a creative thinker. You notice structure and design — the kind of person who spots patterns others miss. You value clarity, purpose, and probably take a leadership role in tasks." },
      { label: "two eyes looking at you", personality: "You're intuitive, empathetic, and sensitive to your surroundings. You might be more people-focused and emotionally aware. You notice faces, emotions, and human expression quickly — someone who connects well with others and values relationships." }
    ]
  },
  {
    _id: new mongoose.Types.ObjectId(),
    imageUrl: "https://res.cloudinary.com/dpz3d1cif/image/upload/v1745741468/4bee8fd9-80bb-4809-8064-cec0d1b41244.png",
    options: [
      { label: "The Man’s Silhouette", personality: "You’re a deep thinker who values introspection and knowledge.This suggests you have a reflective mind, often focused on the bigger picture of life.Seeing the face first shows your interest in identity, human behavior, and philosophy." },
      { label: "The Skyscrapers and City", personality: "You’re ambitious, future-driven, and likely goal-oriented.The skyscrapers symbolize progress, innovation, and the pursuit of success.You are inspired by growth, achievements, and the fast-paced energy of life" },
      { label: "The Yellow Taxis and Empty Road", personality: "You’re likely an adventurer, explorer, or someone who loves freedom.The lone person walking in the middle of the road suggests individualism and courage.You might be someone who seeks clarity and direction amidst the chaos of life." }
    ]
  },
  {
    _id: new mongoose.Types.ObjectId(),
    imageUrl: "https://res.cloudinary.com/dpz3d1cif/image/upload/v1745741456/912b529a-c812-4c3f-a67f-133ffa30e07c.png",
    options: [
      { label: " The White Face in Profile (Facing Right)", personality: "You are a logical thinker, who sees things in a straightforward, structured way.You prefer clarity, direct communication, and are probably solution-focused.This face is sharp and clean, showing you value rationality and honesty." },
      { label: " Two Faces Looking at Each Other", personality: "You’re likely emotionally intelligent and empathetic.You notice relationships, contrasts, and social dynamics.Seeing both sides shows your ability to balance perspectives and think deeply." },
      { label: "The Fire/Light Effect in the Background", personality: "You’re likely creative, passionate, and drawn to emotion, energy, and drama.You focus more on vibes, feelings, and deeper artistic meaning than literal shapes.The fiery contrast reflects your inner intensity and love for symbolism." }
    ]
  },
  {
    _id: new mongoose.Types.ObjectId(),
    imageUrl: "https://res.cloudinary.com/dpz3d1cif/image/upload/v1745741449/7b957e65-bc65-4231-b439-ca7a9dab0026.png",
    options: [
      { label: "The Person on the Beach", personality: " you are likely:Introspective, always thinking deeply about life, purpose, and identity.Emotionally aware and possibly a dreamer or philosopher.The lone figure represents personal journey, suggesting you often seek solitude to reflect and grow." },
      { label: " The Silhouette and Facial Expression", personality: "You are likely empathetic, emotionally intelligent, and human-focused.You pay attention to emotions, facial expressions, and details in people.Her calm expression may resonate with your desire for harmony, self-control, and grace." },
      { label: "The Forest and Hair Merging with Nature", personality: "You are visually imaginative and connected to nature, creativity, and art.You likely notice patterns, textures, and symbolism more than others.The blending of nature with the human form shows you value unity, depth, and aesthetics." }
    ]
  },
  {
    imageUrl: "https://res.cloudinary.com/dpz3d1cif/image/upload/v1745741435/50e37079-484a-4313-9eaa-57f06eafc140.png",
    options: [
      { label: "The Face", personality: "You're likely empathetic, emotionally intuitive, and people-oriented.You’re drawn to human stories, expressions, and the depth within others.You have a natural inclination to understand others on a deeper level and value connection and meaning." },
      { label: "The Birds", personality: "If this stands out first:You're likely a dreamer, a free spirit, and someone who values freedom and creativity.You notice motion, transitions, and the flow of things—often pointing to someone who's imaginative and future-focused." },
      { label: "Building", personality: "If this is what draws your attention:You're probably more logical, structured, and analytical.You’re drawn to context, history, and background details—suggesting someone who looks at the bigger picture and finds meaning in structure and environment.Symbolically, buildings relate to foundations, ambition, and constructed identity." }
    ]
  },
  {
    _id: new mongoose.Types.ObjectId(),
    imageUrl: "https://res.cloudinary.com/dpz3d1cif/image/upload/v1745741423/5fdb4ffd-c5e4-4cd4-b4dc-fe97364e19eb.png",
    options: [
      { label: "Puppets Hands", personality: "You’re a deep thinker who often contemplates control, power, and destiny. You might feel drawn to understanding who (or what) pulls the strings in life." },
      { label: "Chess pieces", personality: "You’re strategic and analytical. You enjoy thinking several steps ahead and you love solving complex problems, whether in games, life, or relationships." },
      { label: "Piano keys", personality: " You’re a creative soul. You see life as a blend of structure and art, and you have a strong connection to music, rhythm, or emotional expression." }
    ]
  },
  {
    _id: new mongoose.Types.ObjectId(),
    imageUrl: "https://res.cloudinary.com/dpz3d1cif/image/upload/v1745741391/a922a3f3-5bc9-435e-96ea-d6bdab332d92.png",
    options: [
      { label: "Glasses", personality: "If the glasses themselves caught your attention first: You're introspective and see the world through your own unique lens. You’re someone who values perception, clarity, and deeper understanding." },
      { label: "London", personality: "If the London Eye caught your attention first: You're adventurous and goal-oriented. Big visions and landmarks excite you—you like aiming for the extraordinary." },
      { label: "River Water", personality: "If the river water stood out to you first: You're emotionally in tune and reflective. You tend to notice underlying moods and are very connected to your environment." }
    ]
  },
  {
    _id: new mongoose.Types.ObjectId(),
    imageUrl: "https://res.cloudinary.com/dpz3d1cif/image/upload/v1745741384/f8e0f155-40bf-4249-a1a5-1b169d2e3270.png",
    options: [
      { label: "The Hand Holding the Bridge Like a Hanger", personality: "If you notice the hand and hanger illusion first, you are creative, witty, and a lateral thinker.You love finding hidden meanings and seeing the world in a way most people miss.You’re probably someone who can turn the ordinary into extraordinary — a true innovator!" },
      { label: "The Bridge and People Walking", personality: "If you notice the bridge and people first, you are grounded, practical, and people-centered.You value connection, stability, and purpose — life is a journey for you, and you like building or crossing bridges (both literally and emotionally).You likely prioritize relationships and steady progress over illusions or distractions." },
      { label: "The Sunset and Cityscape", personality: "If the sunset and the city skyline catch your eye first, you are romantic, emotional, and reflective.You are deeply touched by beauty, nature, and life's transitions.You are someone who finds poetry even in everyday life — you feel deeply and are likely quite intuitive." }
    ]
  },
  {
    _id: new mongoose.Types.ObjectId(),
    imageUrl: "https://res.cloudinary.com/dpz3d1cif/image/upload/v1745741351/75439a28-bc93-41eb-95cb-a828180ee8c7.png",
    options: [
      { label: "Stack of books", personality: "If the books catch your eye first, you are intellectual, imaginative, and dream-driven.You value knowledge, growth, and creativity more than material things.You are someone who sees life as a journey of learning — always building higher, just like the tower of books!" },
      { label: "People and cat", personality: "If you notice the people and the cat first, you are social, nurturing, and emotionally aware.Relationships, companionship, and daily moments matter the most to you.You might be the type who seeks balance between learning and living, feeling and thinking" },
      { label: "Moon and the bird", personality: "If the moon and birds catch your eye first, you are a deep thinker, spiritual, and highly observant.You look beyond the immediate world — fascinated by dreams, freedom, and beauty.You are most at peace when you feel connected to something larger than yourself (like nature, or your dreams)." }
    ]
  },
  {
    _id: new mongoose.Types.ObjectId(),
    imageUrl: "https://res.cloudinary.com/dpz3d1cif/image/upload/v1745741345/50a9e301-7739-46c8-a737-735512166158.png",
    options: [
      { label: "Frog", personality: "If the frog catches your eye first, you are likely adventurous, curious, and energetic.You tend to focus on big pictures and are drawn to bold, vivid experiences.You are not easily scared by challenges — you jump into new opportunities like the frog looks ready to." },
      { label: "Broken Wall", personality: "If the broken wall catches your eye first, you are likely analytical, realistic, and detail-oriented.You notice flaws, structures, and depth before focusing on the main subject.You may have a deep interest in understanding situations beyond the surface — always trying to figure out what caused something rather than what is obvious." },
      { label: "Sitting man", personality: "If the man catches your eye first, you are likely empathetic, thoughtful, and introspective.You focus on human emotions and relationships.You may often wonder how others feel, and you think before you act.You’re the type who reflects on the world and seeks meaning in interactions rather than just the visuals." }
    ]
  },
  {
    _id: new mongoose.Types.ObjectId(),
    imageUrl: "https://res.cloudinary.com/dpz3d1cif/image/upload/v1745741301/f0530809-d9e7-48e6-b604-4019ea00ec8f.png",
    options: [
      { label: "Dancer", personality: "The image of a dancer reflects qualities like discipline and perseverance. It emphasizes the importance of hard work and the pursuit of excellence. These traits align with cognitive processes that involve focus, routine, and persistence in the face of challenges. Engaging in artistic disciplines can enhance functional brain connectivity, improving cognitive flexibility and potentially increasing psychological resilience" },
      { label: "Swan", personality: "The swan symbolizes transformation and inner beauty. Its elegance and grace suggest an appreciation for aesthetics and the transformative power of art, which can provoke reflective thoughts and emotion. Art has been associated with activating brain areas linked to aesthetic experiences, suggesting that engaging with art can help manage stress and enhance mental well-being " },
      { label: "Shadow", personality: "Abstract shapes created by shadow play highlight creativity and introspection. Recognizing patterns within ambiguity engages higher-order cognitive processes, often influenced by individual cognitive states or traits such as creativity and openness to experience . This ability to discern different forms in illusions is linked to visual cortex activity and may involve top-down influences from cognitive states like beliefs and emotions, affecting perception" }
    ]
  },
  {
    _id: new mongoose.Types.ObjectId(),
    imageUrl: "https://res.cloudinary.com/dpz3d1cif/image/upload/v1745741287/e127f595-2e01-4985-8c1b-5ed32da24a13.png",
    options: [
      { label: "Peacock first", personality: "You are someone who values beauty, grace, and presentation.You have a strong creative side and like to express yourself elegantly.You naturally attract people with your charm and confidence." },
      { label: "Feathers first", personality: " You are highly observant and emotionally intelligent.You are good at reading people, understanding their feelings even when they don’t say anything. You see layers and hidden meanings behind appearances." },
      { label: "Pattern or Textual first", personality: "You have a logical, pattern-driven mind. You notice structures, designs, and how things are built before focusing on emotional or surface details.You are a thinker and analyzer, someone who sees the framework of things." }
    ]
  },
  {
    _id: new mongoose.Types.ObjectId(),
    imageUrl: "https://res.cloudinary.com/dpz3d1cif/image/upload/v1745741080/1997c942-f46f-48bf-9ebc-85ebad9d7253.png",
    options: [
      { label: "Swan", personality: "You are a gentle soul, with a strong sense of inner beauty and peace. You seek purity, love, and emotional stability in life.You are sensitive to your environment and often focus on small, beautiful details that others miss." },
      { label: "Trees", personality: "You are a grounded person, practical and connected to nature.You value stability, patience, and personal growth.You know how to stand firm even when life tries to push you around — just like trees sway but stay rooted." },
      { label: "Hidden faces in trees", personality: "You have a deep, analytical mind — always looking beyond the obvious.You are intuitive, philosophical, and often notice hidden emotions in people around you.You seek meaning, not just appearances." }
    ]
  },
  {
    _id: new mongoose.Types.ObjectId(),
    imageUrl: "https://res.cloudinary.com/dpz3d1cif/image/upload/v1745740993/7d3c7ec3-ad56-4e79-90a0-fc61c7e11148.png",
    options: [
      { label: "Impossible architecture", personality: "You are a deep thinker and a logical analyzer. You spot inconsistencies easily and like solving puzzles or mysteries. You question the system around you and don't accept things at face value." },
      { label: "Figure climbing", personality: "You are a goal-oriented dreamer. You focus on growth, progress, and ambitions in life. Even if the path seems impossible, you stay determined to climb higher." },
      { label: "Figure sitting at the top", personality: " You value inner peace, reflection, and contentment. You prefer to observe life from a distance rather than constantly rushing. You may seek mental calm over endless struggle."}

    ]
  },
  {
    _id: new mongoose.Types.ObjectId(),
    imageUrl: "https://res.cloudinary.com/dpz3d1cif/image/upload/v1745740959/bdda28c8-42e2-42c9-b998-0de326b6f377.png",
    options: [
      { label: "waterfall", personality: "Recognizing the waterfall suggests an appreciation for energy and going with the flow. This may indicate a person who is adaptable and able to handle life's challenges smoothly. This aligns with the idea that perception is an adaptive process forged under evolutionary constraints, where the perception of movement and flow can guide adaptive behaviors" },
      { label: "Dancing woman", personality: "Identifying the dancing women highlights a love for creativity and artistic expression. These traits suggest an appreciation for beauty and personal connection. Visual illusions such as these can reveal how artistic perceptions are rooted in neurobiological processes, emphasizing the interaction between sensory input and cognitive processes " },
      { label: "Moonlit Forest", personality: " Noticing the moonlit forest reflects a love for mystery and introspection, suggesting a deep thinker who enjoys exploring complex ideas. This relates to the ability of illusions to engage higher-level cognitive processes, which integrate sensory evidence with prior knowledge to create a subjective experience of reality" }
    ]
  },
  {
    _id: new mongoose.Types.ObjectId(),
    imageUrl: "https://res.cloudinary.com/dpz3d1cif/image/upload/v1745740944/8d694902-c8fb-4a20-9a88-0bfa78733b21.png",
    options: [
      { label: "Horse", personality: "Individuals who spot the horses are likely to value independence and enthusiasm. They tend to be adventurous, driven by a desire for new experiences. This aligns with the concept of perception as an active, adaptive process that guides behavior . Recognizing horses may indicate a preference for dynamic and exploratory environments, reflecting physiological mechanisms that enhance sensory input for quick action" },
      { label: "Snowy mountains", personality: " Noticing the mountains suggests a focus on reliability and resilience. Such individuals often prefer stability and are adept at handling challenges. This perception may be connected to the understanding of illusions, as they show how the brain constructs stable interpretations of stimuli for adaptive reasons . Mountains can represent a solid, grounded perspective, fostering solutions to complex problems." },
      { label: "General insights", personality: "Observing both the horses and mountains indicates a keen eye for detail and the ability to switch perspectives. This ability demonstrates perceptual flexibility, essential for adapting to ambiguous sensory inputs by using a Bayes-optimal model" }
    ]
  },
  {
    _id: new mongoose.Types.ObjectId(),
    imageUrl: "https://res.cloudinary.com/dpz3d1cif/image/upload/v1745740906/e830cf83-d2d7-41d2-a241-be9d7fbf2df1.png",
    options: [
      { label: "Figures Climbing", personality: ": The figures climbing the wax symbolize determination and a goal-oriented mindset. Those who resonate with this imagery are likely to exhibit ambition and a drive to overcome obstacles. The illusion itself, as characterized by perceptual discrepancies, showcases how visual perception can guide adaptive behaviors and reflect inherent personality traits " },
      { label: "Figures Supporting Each Other", personality: "Some figures appear to be assisting others, emphasizing traits of cooperation and empathy. These individuals often value teamwork and prioritize collective success. Empathy-related responses to visual stimuli involve dynamic interactions between socio-cognitive and esthetic processing, accounting for personal characteristics and contextual variables" },
      { label: "Figures in Repose", personality: "Figures that are at rest indicate introspection and thoughtfulness. Those who identify with this aspect are typically reflective and mindful, valuing personal insight. Cognitive penetration and the way prior knowledge can affect perceptual experiences highlight the relationship between internal reflection and visual perception" }
    ]
  },
  {
    _id: new mongoose.Types.ObjectId(),
    imageUrl: "https://res.cloudinary.com/dpz3d1cif/image/upload/v1745740879/2138f403-294a-47bc-9f37-ca5813760e46.png",
    options: [
      { label: "Ship Structure", personality: " Recognizing the ship's structure suggests a focus on tangible and systematic thinking, linking to the stability of perception and the organized processing of visual stimuli, as discussed in visual constancy research. Individuals with this trait are often methodical and value order." },
      { label: "Dragonfly Wings", personality: "Identifying the transformation of sails into dragonfly wings shows a capacity for creativity and imagination. This aligns with findings that link creative individuals to higher perceptual switching rates in ambiguous visual illusions. It highlights an ability to think outside conventional boundaries." },
      { label: "Ocean and Sky", personality: " The expansive ocean and sky elements may represent a love for adventure and exploration. This reflects an inquisitive nature and a tendency toward seeking new horizons, a trait associated with context-driven perception. Such individuals often embrace the unknown and enjoy discovering new perspectives." }
    ]
  },
  {
    _id: new mongoose.Types.ObjectId(),
    imageUrl: "https://res.cloudinary.com/dpz3d1cif/image/upload/v1745740786/7e9c2a5b-daf1-4810-9ca1-9e46ca3d3d93.png",
    options: [
      { label: "Face", personality: "This image forms a face when viewed holistically, indicating the ability to synthesize details into a coherent understanding. People who quickly notice this often excel in integrating multiple viewpoints and seeing the bigger picture. This relates to the interplay of different perceptual domains, where context-driven perception can stabilize ambiguous visual information" },
      { label: "Woman on rock", personality: "The depiction of a woman suggests a reflective and introspective personality. Such individuals are often empathetic and in tune with their emotions, valuing deep personal insight. The perception of emotional nuances is informed by neural processes that allow previous experiences to shape current visual interpretations " },
      { label: "Bird and Pearl", personality: "he bird and pearl symbolize curiosity and the quest for knowledge. Those who focus on these elements are likely adventurous and enjoy discovering new ideas and experiences. This parallels findings that link divergent thinking and exploration to enhanced perception of visual ambiguities " }
    ]
  },
  {
    _id: new mongoose.Types.ObjectId(),
    imageUrl: "https://res.cloudinary.com/dpz3d1cif/image/upload/v1745740774/b29207c6-ed97-40ee-8985-9f75fb9fa785.png",
    options: [
      { label: "Skull", personality: "Spotting the hidden skull indicates strong observational skills and analytical thinking. People who can quickly identify such patterns are often detail-oriented and perceptive. This reflects research showing how illusions arise from perceptual discrepancies, revealing cognitive attributes" },
      { label: "Woman", personality: "The image of the woman symbolizes introspection and sensitivity. Those drawn to this aspect might demonstrate empathy and a reflective nature, engaging deeply with emotions and thoughts. Visual stimuli that involve context and variance can shed light on perceptual stabilization, enhancing understanding of emotional nuances" },
      { label: "Nature and Bridges", personality: "The natural setting with elements like the bridge suggests curiosity and a love for exploration. Individuals who focus on these areas often enjoy adventure and seek new experiences, reflecting an open-minded and inquisitive personality. The stability and alternation of perceptual dominance in ambiguous stimuli are indicative of this exploratory trait" }
    ]
  },
 
  {
    _id: new mongoose.Types.ObjectId(),
    imageUrl: "https://res.cloudinary.com/dpz3d1cif/image/upload/v1745740732/93ccafa0-d1f9-4e32-af60-8385a5bfc1bd.png",
    options: [
      { label: " Squirrel", personality: "The squirrel represents curiosity and playfulness, suggesting a personality eager to explore and engage in diverse activities. Such individuals often exhibit high energy and a desire to learn new things. This aligns with studies that showcase how visual perception reflects cognitive processes related to curiosity and exploration" },
      { label: "Horse", personality: "The horse symbolizes strength and a quest for freedom, implying a personality that values independence and goal-oriented behavior. These individuals are resilient and determined, often overcoming obstacles through sheer willpower. Research highlights how visual illusions can manifest traits related to independence and determination through perceptive insights" },
      { label: "Face Illusion", personality: "The perception of a face within the image can indicate a perceptive and analytical mind. This suggests a personality capable of understanding multiple perspectives and appreciating complexity. Individuals with this trait are often thoughtful and skilled in problem-solving. The phenomenon of face pareidolia further supports this notion, illustrating how individuals rapidly detect and interpret face-like element" }
    ]
  },
  {
    _id: new mongoose.Types.ObjectId(),
    imageUrl: "https://res.cloudinary.com/dpz3d1cif/image/upload/v1745740710/bdde8350-bace-450c-b450-6d430443383c.png",
    options: [
      { label: "Caterpillar", personality: "The caterpillar represents potential and the early stages of growth, reflecting a personality open to learning and full of potential. This aligns with the idea that visual perception can reveal cognitive processes related to personal development and adaptation [2]. The caterpillar symbolizes a willingness to evolve and adapt, indicative of curiosity and readiness for self-improvement." },
      { label: "Butterfly", personality: "The butterfly symbolizes transformation and freedom, portraying a personality that values change and embraces personal evolution. This is akin to individuals who are open to new experiences and resilient in facing life's challenges [7]. The transformation from a caterpillar to butterfly metaphorically represents significant personal growth, emphasized in studies linking cognitive perception to transformation" },
      { label: "Leaf with Puzzle Pieces", personality: "The leaf, with its puzzle piece cutouts, highlights complexity and an analytical mindset. This suggests a personality that enjoys solving problems and appreciates intricate details, reflecting individuals with high cognitive flexibility and problem-solving abilities [3]. The ability to perceive and interpret visual complexities has been connected to the analytical aspect of perception, reinforcing this personality trait " }
    ]
  },
  {
    _id: new mongoose.Types.ObjectId(),
    imageUrl: "https://res.cloudinary.com/dpz3d1cif/image/upload/v1745740482/ea45d5ec-9b3d-4f90-995a-2cf83496882f.png",
    options: [
      { label: "Bridge", personality: " The bridge, symbolizing connectivity and the ability to overcome obstacles, indicates a personality that values relationship-building and facilitating progress. These individuals often act as problem solvers and mediators, helping themselves and others traverse life's challenges. This aligns with the notion that visual perception is not just about identifying physical forms but involves cognitive processing that reflects personality traits related to problem-solving and mediation" },
      { label: "Sailing Ships", personality: " Sailing ships suggest a sense of adventure and a desire to explore new territories. This indicates a personality characterized by curiosity, open-mindedness, and a love for discovery. Such traits are often associated with higher levels of openness and intellect, contributing to a desire for exploration and new experiences" },
      { label: "Cloud Formations", personality: "Whimsical clouds highlight a strong imaginative and dreamy nature. This suggests a personality that thrives on creativity and visionary thinking, envisioning possibilities beyond the ordinary. Such characteristics are emblematic of individuals who are dreamers and idealists, capable of innovative thinking and creativity" }
    ]
  },
  {
    _id: new mongoose.Types.ObjectId(),
    imageUrl: "https://res.cloudinary.com/dpz3d1cif/image/upload/v1745740449/f2e7ab3a-8c6d-4e7a-9aac-596e538d3b88.png",
    options: [
      { label: "Elephant", personality: "The elephant is often symbolized as an emblem of wisdom, strength, and memory. This suggests a personality characterized by thoughtfulness, dependability, and resilience. Individuals with these traits typically demonstrate patience, a strong sense of community, and unwavering loyalty. This aligns with research on animal personality, indicating that traits like wisdom and strength are expressed across species, enriching our understanding of human personality through the animal kingdom " },
      { label: "Donkey", personality: "The image of a donkey is synonymous with persistence and diligence. A personality reflected by this symbolism may exhibit practicality and groundedness, embodying a consistent work ethic. These individuals often strive for reliability and fulfillment through hard work. While social interpretations of animal traits can vary, the solid work ethic associated with donkeys remains a culturally widespread perception" },
      { label: "Dog", personality: " Dogs often represent loyalty, friendliness, and protective behavior. A personality seen through this lens values relationships and offers steady support and companionship to others. Empathy and social orientation are hallmark traits of such individuals. The connection between animals and human personality traits continues to draw interest in comparative psychology, extending the understanding of personality traits beyond species-specific boundaries " }
    ]
  },
  {
    _id: new mongoose.Types.ObjectId(),
    imageUrl: "https://res.cloudinary.com/dpz3d1cif/image/upload/v1745740427/edc01c3f-965f-4110-9b8f-eebcd416b7ae.png",
    options: [
      { label: "Two Girls with a Toy Rabbit", personality: "The interaction between two girls sharing a toy rabbit suggests a nurturing and imaginative personality. This reflects traits typically associated with warmth, playfulness, and gentle companionship. Such attributes suggest an individual with strong social bonds and a capacity for imagination and creativity." },
      { label: "Silhouetted Onlookers", personality: "The presence of dark silhouetted onlookers indicates a mysterious and observant nature. This suggests a personality that values introspection and analysis, often preferring to observe and reflect rather than participate directly. It can denote a preference for privacy and a contemplative approach to life." },
      { label: "Victorian Setting", personality: "The Victorian-style setting, with its traditional and elegant atmosphere, points to a personality that appreciates history and sophistication. Such a person might value cultural depth, tradition, and an affinity for timeless elegance. This appreciation suggests a refined taste and an alignment with classical values." }
    ]
  },
  
  
];

const start = async () => {
  try {
    await mongoose.connect("mongodb+srv://VibeCare:VibeCare67@cluster0.1rleb9o.mongodb.net/new_db?retryWrites=true&w=majority", {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    await Image.insertMany(images);
    console.log("Images inserted!");
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

start();