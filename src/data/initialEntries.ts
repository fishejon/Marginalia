import { Entry } from '../types';

export const INITIAL_ENTRIES: Entry[] = [
  {
    id: 'entry-thinking-fast',
    title: 'Thinking, Fast and Slow',
    author: 'Daniel Kahneman',
    medium: 'book',
    coverUrl: '/src/assets/images/cover_thinking_fast_1790374418150.jpg',
    dateLogged: '2026-08-14',
    rating: 5,
    tags: ['Decision Making', 'Cognitive Bias', 'Psychology', 'Strategy'],
    status: 'completed',
    whatImThinking:
      'Our minds operate on two drastically different operating systems: System 1 (fast, intuitive, emotional, effortless) and System 2 (slow, deliberative, logical, lazy). Almost all strategic business mistakes occur when we trust System 1 on problems that strictly demand System 2 deliberate scrutiny.',
    whyILikedIt:
      'Kahneman completely dismantled my illusion of rational decision-making with humility and humor. The loss aversion concept (losses loom twice as large as equivalent gains) and the "What You See Is All There Is" (WYSIATI) principle forever changed how I review investment cases and product pitches.',
    howIllUseItGoingForward:
      '1. Implement a mandatory "Premortem" before launching major initiatives: imagine the project failed 12 months from now and write the post-mortem today.\n2. When reviewing quarterly risk, force myself to calculate downside exposure explicitly rather than relying on gut confidence.\n3. Never negotiate or make high-stakes pricing commitments when mentally fatigued (System 2 ego depletion).',
    clubDiscussion: [
      {
        id: 'qa-1',
        question: 'Which cognitive bias do you catch yourself falling victim to most frequently in daily work?',
        answer: 'Availability heuristic and confirmation bias: I tend to judge market risk based on the most vivid recent story in tech news rather than base rate probabilities.'
      },
      {
        id: 'qa-2',
        question: 'How do you balance Kahneman’s caution against intuition with the need for speed in startups?',
        answer: 'Reserve System 2 deliberation strictly for irreversible decisions (Type 1 doors). Allow fast intuitive System 1 experiments for easily reversible choices (Type 2 doors).'
      }
    ],
    quotes: [
      {
        id: 'q-1',
        text: 'A reliable way to make people believe in falsehoods is frequent repetition, because familiarity is not easily distinguished from truth.',
        location: 'Part 1, Chapter 5'
      },
      {
        id: 'q-2',
        text: 'We are prone to overestimate how much we understand about the world and to underestimate the role of chance in events.',
        location: 'Part 3, Overconfidence'
      }
    ],
    synthesis: {
      thesis: 'Human rationality is inherently bounded by two cognitive systems; mastering judgment requires designing deliberate checkpoints to restrain instinctive System 1 overconfidence.',
      keyPrinciples: [
        'System 1 vs System 2 Cognitive Architecture: Intuition is fast and associative, while rigorous calculation demands energy and conscious effort.',
        'Loss Aversion: The psychological pain of losing is twice as potent as the pleasure of winning, skewing risk evaluations.',
        'WYSIATI (What You See Is All There Is): The mind constructs coherent narratives based only on available evidence, ignoring critical unknown unknowns.'
      ],
      actionPlaybook: [
        {
          id: 'act-1',
          action: 'Institutionalize a 20-minute Premortem before final sign-off on strategic initiatives.',
          category: 'Strategic Decision'
        },
        {
          id: 'act-2',
          action: 'Review base-rate statistics before evaluating optimistic founder or team projections.',
          category: 'Habit'
        },
        {
          id: 'act-3',
          action: 'Audit current pricing proposals for framing bias and anchoring effects.',
          category: 'Immediate'
        }
      ],
      recommendationPitch: {
        whyRecommend: 'It is the definitive manual on how the human brain actually processes information, errors, and risk.',
        whoShouldRead: 'Product managers, founders, executives, and anyone tasked with making high-consequence decisions under uncertainty.',
        ratingBlurb: 'Essential reading that will humble your confidence and sharpen your judgment.'
      },
      synthesizedAt: '2026-08-16T10:30:00.000Z'
    }
  },
  {
    id: 'entry-atomic-habits',
    title: 'Atomic Habits',
    author: 'James Clear',
    medium: 'book',
    coverUrl: '/src/assets/images/cover_atomic_habits_1790374427103.jpg',
    dateLogged: '2026-07-22',
    rating: 5,
    tags: ['Habits', 'Productivity', 'Systems', 'Personal Growth'],
    status: 'completed',
    whatImThinking:
      'You do not rise to the level of your goals; you fall to the level of your systems. Most people fail to sustain changes because they focus on outcome-based habits ("I want to write a book") rather than identity-based habits ("I am someone who writes every morning for 30 minutes").',
    whyILikedIt:
      'Exceptionally actionable and lucid. There is zero fluff. The 4 Laws of Behavior Change (Make it Obvious, Attractive, Easy, Satisfying) gave me a reproducible diagnostic framework to debug any broken routine.',
    howIllUseItGoingForward:
      '1. Environment design: Remove visual friction for positive habits (keep reading book on nightstand) and increase friction for distractions (leave phone in another room during deep work).\n2. Habit stacking: After pouring my morning coffee, I will immediately open my reading vault and record one insight.\n3. The Two-Minute Rule: When starting a difficult task, shrink the ritual down to an action that takes under 120 seconds.',
    clubDiscussion: [
      {
        id: 'qa-clear-1',
        question: 'What is one friction point in your current workspace that is sabotaging your focus?',
        answer: 'Having social apps and browser notifications enabled on my primary laptop. I need to treat my desk as a single-purpose writing sanctuary.'
      }
    ],
    quotes: [
      {
        id: 'q-clear-1',
        text: 'Every action you take is a vote for the type of person you wish to become.',
        location: 'Chapter 2'
      },
      {
        id: 'q-clear-2',
        text: 'You don’t have to be the victim of your environment. You can also be the architect of it.',
        location: 'Chapter 6'
      }
    ],
    synthesis: {
      thesis: 'Sustainable personal transformation is not the result of heroic motivation, but the compounding aggregation of 1% incremental improvements embedded in environmental architecture.',
      keyPrinciples: [
        'Identity-Based Habits: Long-term habit adherence is anchored in who you believe you are, not what metric you are chasing.',
        'The Four Laws of Behavior Change: To build a habit make it obvious, attractive, easy, and satisfying; to break one, invert the laws.',
        'The Valley of Latent Potential: Results often lag behind effort; habits often seem to make no difference until you cross a critical threshold.'
      ],
      actionPlaybook: [
        {
          id: 'act-c-1',
          action: 'Establish a 2-minute starter ritual for creative writing and strategic planning.',
          category: 'Habit'
        },
        {
          id: 'act-c-2',
          action: 'Audit physical workspace to place priority tools in plain view and bury distractions.',
          category: 'Immediate'
        },
        {
          id: 'act-c-3',
          action: 'Reframe goal setting into identity declarations during weekly reviews.',
          category: 'Strategic Decision'
        }
      ],
      recommendationPitch: {
        whyRecommend: 'The clearest, most pragmatic manual ever written on turning micro-behaviors into compounded advantages.',
        whoShouldRead: 'Anyone feeling overwhelmed by ambitious goals or struggling with inconsistency in creative and business routines.',
        ratingBlurb: 'A masterclass in behavioral mechanics that delivers instant dividends.'
      },
      synthesizedAt: '2026-07-24T14:15:00.000Z'
    }
  },
  {
    id: 'entry-huberman-focus',
    title: 'Optimal Protocols for Focus, Dopamine & Energy',
    author: 'Dr. Andrew Huberman (Huberman Lab)',
    medium: 'podcast',
    coverUrl: '/src/assets/images/cover_podcast_huberman_1790374434926.jpg',
    dateLogged: '2026-09-02',
    rating: 5,
    tags: ['Neuroscience', 'Deep Work', 'Energy', 'Bio-optimization'],
    status: 'completed',
    whatImThinking:
      'Dopamine is not the molecule of reward—it is the molecule of anticipation and pursuit. When we spike dopamine constantly through cheap friction-free rewards, our baseline crashes and our motivation evaporates for hard intellectual work.',
    whyILikedIt:
      'Grounding productivity in neurobiology is so much more effective than relying on guilt or willpower. The explanation of 90-minute ultradian rhythm cycles helped me understand why expecting 6 unbroken hours of deep problem solving is biologically counterproductive.',
    howIllUseItGoingForward:
      '1. Get 10–15 minutes of direct sunlight viewing within 30 minutes of waking to anchor the cortisol pulse and circadian rhythm.\n2. Structure deep creative work in strict 90-minute ultradian bouts with 10-minute zero-input rest.\n3. Delay morning caffeine by 90 minutes after waking to prevent the afternoon adenosine crash.',
    clubDiscussion: [
      {
        id: 'qa-h-1',
        question: 'How do you handle the initial friction and restlessness at the start of a deep work block?',
        answer: 'Huberman explains that the agitation during the first 5-10 minutes is norepinephrine release—it is the signal that focus is engaging, not a sign to quit.'
      }
    ],
    quotes: [
      {
        id: 'q-h-1',
        text: 'Friction and agitation in the brain during the onset of focus is not a sign that something is wrong; it is the physiological entry tax required for neuroplasticity.',
        location: 'Timestamp 42:18'
      }
    ],
    synthesis: {
      thesis: 'High cognitive performance is governed by physiological rhythms; by aligning work with ultradian cycles and dopamine baselines, focus becomes effortless and sustainable.',
      keyPrinciples: [
        'Dopamine Baseline Dynamics: Spiking dopamine with low-effort gratification lowers baseline drive for high-consequence pursuits.',
        'Ultradian Focus Cycles: The brain can only sustain peak cognitive output for ~90 minutes before requiring nervous system replenishment.',
        'Circadian Entrainment: Early photic stimulation anchors neurochemical rhythms across the 24-hour cycle.'
      ],
      actionPlaybook: [
        {
          id: 'act-h-1',
          action: 'View outdoor morning light within 30 minutes of waking.',
          category: 'Habit'
        },
        {
          id: 'act-h-2',
          action: 'Cap analytical work blocks at 90 minutes followed by non-screen mental rest.',
          category: 'Immediate'
        },
        {
          id: 'act-h-3',
          action: 'Delay first espresso until 90 minutes post-waking to eliminate afternoon slump.',
          category: 'Habit'
        }
      ],
      recommendationPitch: {
        whyRecommend: 'Translates peer-reviewed neurobiology into immediate, actionable daily protocols without hype.',
        whoShouldRead: 'Knowledge workers, engineers, and creatives experiencing mental fatigue or erratic energy levels.',
        ratingBlurb: 'Essential listening for anyone who uses their mind as their primary professional instrument.'
      },
      synthesizedAt: '2026-09-03T09:00:00.000Z'
    }
  },
  {
    id: 'entry-psychology-money',
    title: 'The Psychology of Money',
    author: 'Morgan Housel',
    medium: 'book',
    dateLogged: '2026-06-10',
    rating: 5,
    tags: ['Wealth', 'Decision Making', 'Psychology', 'Personal Growth'],
    status: 'completed',
    whatImThinking:
      'Doing well with money has a little to do with how smart you are and a lot to do with how you behave. Financial success is not a hard science; it is a soft skill where your psychology and self-control matter far more than spreadsheets.',
    whyILikedIt:
      'Housel writes with stunning clarity and parables. His distinction between being rich (current income) and being wealthy (unspent financial flexibility and freedom) completely recalibrated how I view company runway and personal savings.',
    howIllUseItGoingForward:
      '1. Treat the highest form of wealth as the ability to wake up every morning and say, "I can do whatever I want today."\n2. Maintain an extra cushion of cash reserves that seems slightly irrational on paper, because it buys emotional calmness during volatility.\n3. Avoid the moving goalpost: explicitly define "enough" for projects and financial targets.',
    clubDiscussion: [
      {
        id: 'qa-m-1',
        question: 'How do you define "enough" in your professional and business ambitions?',
        answer: 'Enough is having complete autonomy over my calendar and working exclusively on problems with people I genuinely admire.'
      }
    ],
    quotes: [
      {
        id: 'q-m-1',
        text: 'The ability to do what you want, when you want, with who you want, for as long as you want, is the highest dividend money pays.',
        location: 'Chapter 7: Freedom'
      },
      {
        id: 'q-m-2',
        text: 'Spending money to show people how much money you have is the fastest way to have less money.',
        location: 'Chapter 8: Man in the Car Paradox'
      }
    ],
    synthesis: {
      thesis: 'True financial independence is the purchase of time and psychological resilience, not the accumulation of luxury goods to signal status.',
      keyPrinciples: [
        'Freedom as Dividend: The greatest value of capital is independence over one’s time and options.',
        'Compounding Requires Longevity: The secret to outsized compounding is not chasing highest returns, but never interrupting the process prematurely.',
        'Room for Error: A plan is only good if it accounts for things not going according to plan.'
      ],
      actionPlaybook: [
        {
          id: 'act-m-1',
          action: 'Establish an untouchable 6-month buffer that allows calm decision-making.',
          category: 'Strategic Decision'
        },
        {
          id: 'act-m-2',
          action: 'Document a written definition of "Enough" for personal and business milestones.',
          category: 'Immediate'
        }
      ],
      recommendationPitch: {
        whyRecommend: 'The most humane, elegant book on capital and personal peace of mind ever written.',
        whoShouldRead: 'Founders, investors, and anyone negotiating the balance between ambition and life satisfaction.',
        ratingBlurb: 'A timeless antidote to financial anxiety.'
      },
      synthesizedAt: '2026-06-12T16:00:00.000Z'
    }
  }
];
