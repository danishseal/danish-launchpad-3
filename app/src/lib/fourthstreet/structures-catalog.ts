/**
 * The structure directory, written from contracts/src/traits/*.sol and nothing else.
 *
 * Ported verbatim from ~/4thstreet/app/src/lib/traits-catalog.ts on 2026-09-09. Each
 * entry's `family` and `name` are the exact strings the contract's own `describe()`
 * returns, the parameter tables are the packed bytes32 layouts from the source, and the
 * worked settings are the ones the source proposes. All seventeen are deployed on chain
 * 4663 and answer describe(); a token page reads the installed ones off the pool rather
 * than from this file, so the two cannot silently disagree.
 *
 * A structure is a module the hook calls on every swap. It can add fee and NOTHING else.
 * Which four are installed is chosen at launch and frozen forever.
 */

export type TraitFamily = "physical" | "delivery" | "supply" | "term" | "reference";

export type TraitParam = {
  name: string;
  bits: string;
  type: string;
  range: string;
  meaning?: string;
};

export type Trait = {
  slug: string;
  /** `describe()` second return value. */
  name: string;
  /** `describe()` first return value. */
  family: TraitFamily;
  tagline: string;
  /** What the trait says about a real market, in the source's own framing. */
  blurb: string;
  /** Load-bearing behaviour, each one a property the contract actually holds. */
  points: string[];
  /** Which side of the trade pays. */
  side: "both" | "buys" | "sells";
  /**
   * Always false since 2026-09-08. `refuse` was removed from `ITrait` as a TYPE,
   * not merely left unused, so no structure written after the hook is immutable
   * can reintroduce it. Delivery was the one that used it and now charges the
   * maximum instead of blocking. Kept as a field so the directory can say so out
   * loud rather than quietly dropping a capability people were told about.
   */
  canRefuse: boolean;
  /** Traits that go quiet once the pool flips to AMM mode. */
  inertAfterGraduation: boolean;
  /** True when the trait writes state, which costs a dirty SSTORE per swap. */
  stateful: boolean;
  params: TraitParam[];
  worked?: string;
  sourceFile: string;
};

export const TRAIT_FAMILIES: { id: TraitFamily; label: string; blurb: string }[] = [
  {
    id: "physical",
    label: "Physical mechanics",
    blurb: "What it costs to hold a real thing in a real warehouse.",
  },
  {
    id: "delivery",
    label: "Delivery and squeeze",
    blurb: "Whether the warehouse can actually pay out everyone holding a claim.",
  },
  {
    id: "term",
    label: "Term structure and carry",
    blurb: "The shape of the curve rather than the level of it.",
  },
  {
    id: "supply",
    label: "Supply shock and cartel",
    blurb: "Production is a rate, not a level, and somebody sets the rate.",
  },
  {
    id: "reference",
    label: "Reference",
    blurb: "The one that does nothing, on purpose.",
  },
];

export const TRAITS: Trait[] = [
  {
    slug: "outage",
    name: "Outage",
    family: "physical",
    tagline: "Things break without warning, and the price finds out before anybody does",
    blurb:
      "Every physical market has the same hole in it. A refinery trips, a mine floods, a compressor station fails, and the spot price moves before the press release does. Planned maintenance is on a calendar and the curve has already priced it. An unplanned outage is the thing the curve cannot price, which is exactly why it is the event that pays. This launch has outages: six an hour, twenty seconds each, drawn from a clock nobody is watching. Inside one the toll opens at its peak and falls away by halves, so the trade that arrives first pays most and the market is back to normal before the minute is out. Outside one it charges nothing at all, which is 96.7% of every hour.",
    points: [
      "The schedule is deterministic and public. keccak256(poolId, hourIndex) seeds one hour, six 32-bit draws pick the starts, and anyone who reads the contract can compute every window for the next thousand years. It taxes inattention, not ignorance, so the app draws the schedule rather than hiding it.",
      "The 60% headline is not what anybody pays. A trade landing uniformly inside a 20 second window at a 7 second half-life pays 27.4% on average, and across a whole day at 3.33% occupancy the expected cost is about 91 bps of volume.",
      "Overlaps take the maximum, not the sum. Two outages at once is still one outage as far as a price is concerned.",
      "Windows are clamped inside the hour rather than allowed to wrap, so the last windowSec of each hour can never begin one. Documented, not hidden.",
      "Symmetric. An outage moves spot for everyone in the pit.",
    ],
    side: "both",
    canRefuse: false,
    inertAfterGraduation: false,
    stateful: false,
    params: [
      { name: "peakPpm", bits: "0..23", type: "uint24", range: "ppm at t = 0 inside a window" },
      { name: "windowSec", bits: "24..39", type: "uint16", range: "window length, seconds" },
      { name: "halfLifeSec", bits: "40..55", type: "uint16", range: "decay half-life, seconds" },
      { name: "perHour", bits: "56..63", type: "uint8", range: "windows per hour, max 8" },
      { name: "capPpm", bits: "64..87", type: "uint24", range: "this slot's frozen ceiling" },
    ],
    worked:
      "peakPpm 600000, windowSec 20, halfLifeSec 7, perHour 6, capPpm 600000. Six twenty-second outages an hour opening at 60%.",
    sourceFile: "contracts/src/traits/OutageTrait.sol",
  },
  {
    slug: "carry",
    name: "Carry",
    family: "physical",
    tagline: "Storage costs money, and somebody has been paying it since block one",
    blurb:
      "A share of GLD is a claim on gold in a vault in London, and the vault is not free. The sponsor deducts 0.40% a year from the metal itself, so the number of ounces behind each share falls every day whether or not anybody trades. SLV does the same at 0.50%, USO at about 0.60%, SPY at 0.0945%. Nobody sends you an invoice; the bar just gets smaller. A FourthStreet pool holds the real thing, so from the moment it opens it is a warehouse paying rent on inventory it has not sold. This puts that rent on the ticket.",
    points: [
      "Monotone and capped. The fee is a non-decreasing function of time since launch and of nothing else, so the whole curve can be drawn at launch and is predictable years out.",
      "Symmetric. Rent does not care which way you are facing; the warehouse paid it either way.",
      "The quietest mechanic in the directory and the most literal. There is no game in it and nothing to time.",
    ],
    side: "both",
    canRefuse: false,
    inertAfterGraduation: false,
    stateful: false,
    params: [
      { name: "carryPpmPerYear", bits: "0..23", type: "uint24", range: "1 .. 100000", meaning: "4000 = 0.40% a year = GLD" },
      { name: "capPpm", bits: "24..47", type: "uint24", range: "1 .. 100000" },
      { name: "graceDays", bits: "48..63", type: "uint16", range: "0 .. 3650", meaning: "free storage before rent starts" },
    ],
    worked:
      "The real published sponsor fees: GLD 4000, SLV 5000, USO 6000, SPY 945, SGOV 900. The trait does not know what the number means; it means whatever the launcher can defend.",
    sourceFile: "contracts/src/traits/CarryTrait.sol",
  },
  {
    slug: "spoilage",
    name: "Spoilage",
    family: "physical",
    tagline: "Goods left on the shelf go off, and the shelf remembers how long it has been",
    blurb:
      "A merchant with perishable stock treats a full shelf and an empty one completely differently. Stock that has been sitting is worth less than stock that just arrived, so the merchant will take almost anything to clear it and will pay very little to take more in. So this pool's unsold inventory spoils. Coming to buy is free, always, at any staleness, because you are clearing the shelf. Coming to sell, handing stock back onto a shelf that is already stale, costs more the longer the quiet lasted. Any trade resets the clock.",
    points: [
      "Spoilage scales with how full the shelf is. The rate is weighted by tRes / supply, so a launch that has sold three quarters of its inventory carries a quarter of the spoilage.",
      "A dust trade does not clear a shelf, and this is enforced. A trade refreshes only if it is at least minTradePpm of the pool's own underlying reserve, so the one-wei defeat of the naive version does not work.",
      "Sell side only. The worst it can do to a seller is capPpm, and it never refuses.",
      "The only trait that writes state on most swaps, which costs a dirty SSTORE of about 2,900 gas.",
    ],
    side: "sells",
    canRefuse: false,
    inertAfterGraduation: false,
    stateful: true,
    params: [
      { name: "spoilPpmPerDay", bits: "0..23", type: "uint24", range: "1 .. 100000" },
      { name: "capPpm", bits: "24..47", type: "uint24", range: "1 .. 100000" },
      { name: "graceHours", bits: "48..63", type: "uint16", range: "0 .. 8760", meaning: "quiet time that does not count" },
      { name: "minTradePpm", bits: "64..87", type: "uint24", range: "0 .. 1000000", meaning: "size that counts as a turnover" },
    ],
    worked:
      "A fast-turning name: spoilPpmPerDay 2000, capPpm 20000, graceHours 12, minTradePpm 1000.",
    sourceFile: "contracts/src/traits/SpoilageTrait.sol",
  },
  {
    slug: "delivery",
    name: "Delivery",
    family: "delivery",
    tagline: "What happens when more people hold a claim on the warehouse than it can deliver",
    blurb:
      "Every commodity market eventually arrives at the same question, and it is not about price. It is: if everybody who holds a contract asked for the metal today, is the metal there. In March 2022 the LME found more nickel contracts outstanding than deliverable nickel, the price tripled in a morning, and the exchange cancelled a day of trades. A FourthStreet launch has exactly this shape by construction: tokens held outside the pool are claims, the underlying the pool holds is the deliverable, and on a constant-product curve those two numbers diverge by arithmetic. A launch that has sold three quarters of its tokens can deliver on one quarter of what they are marked at. That is true of every bonding curve ever deployed. Most of them do not say so.",
    points: [
      "Coverage is exact, not a vibe: deliverable is the launch's own claim ledger net of fees owed, notional is the float outside the pool marked at the marginal price, and coverage is the ratio in ppm.",
      "It uses this launch's OWN ledger and never a token balance, because two launches on the same underlying share one ERC-6909 balance and that number says nothing about either.",
      "It no longer blocks anything. Until 2026-09-08 a buy inside the delivery window returned `refuse`; `refuse` is now gone from ITrait entirely, so haltBuys charges the maximum instead of forbidding. Selling was never charged and never refused, in any window, at any coverage level.",
      "The window always ends and validate() proves it: the window is at most half its period, so trading is open for at least half of every cycle, and there is no setter anywhere in the contract.",
      "Inert after graduation. A warehouse that became a two-sided market no longer has delivery risk to price.",
    ],
    side: "buys",
    canRefuse: false,
    inertAfterGraduation: true,
    stateful: false,
    params: [
      { name: "squeezePpm", bits: "0..23", type: "uint24", range: "1 .. 100000", meaning: "charge at zero coverage" },
      { name: "coverThreshPpm", bits: "24..47", type: "uint24", range: "1 .. 1000000", meaning: "coverage at which it engages" },
      { name: "periodDays", bits: "48..63", type: "uint16", range: "0 .. 3650", meaning: "0 disables the window entirely" },
      { name: "windowHours", bits: "64..79", type: "uint16", range: "0 .. 8760", meaning: "must be 0 iff periodDays is 0" },
      { name: "haltBuys", bits: "80..87", type: "uint8", range: "0 or 1" },
    ],
    worked:
      "squeezePpm 30000 (3% at zero coverage), coverThreshPpm 500000 (engages once the warehouse covers less than half its own float), periodDays 30, windowHours 8, haltBuys 1. A monthly contract with an eight hour delivery window at the end.",
    sourceFile: "contracts/src/traits/DeliveryTrait.sol",
  },
  {
    slug: "term",
    name: "TermStructure",
    family: "term",
    tagline: "The shape of the curve, not the level of it, is what a carry market charges for",
    blurb:
      "A futures market almost never quotes one price. It quotes a front month and a back month, and the gap between them is the whole business. When the front is dearer the market is in contango and a fund that has to keep rolling bleeds, which is why USO tracked oil so badly through 2020 that it had to redesign itself. When the front is cheaper the market is in backwardation and holding the physical thing pays you. A launch here has no second month to quote, but it has its own history: a slow-moving anchor price, and the gap between spot and that anchor is the term structure this market can actually observe.",
    points: [
      "Two modes. Roll charges the directional side: contango charges buys, backwardation charges sells. Spread charges both and is a pure volatility toll with no view in it.",
      "tau has a floor of 60 seconds. A tau that refreshes inside one block would make the anchor equal spot forever and the spread identically zero, which is a trait that reads as installed and does nothing.",
      "State is packed: a 128-bit anchor price, a 40-bit timestamp, and a seeded bit, so a zero word unambiguously means the anchor was never set.",
      "Writes state on every swap after the first, so the hook's persist is a dirty SSTORE.",
    ],
    side: "both",
    canRefuse: false,
    inertAfterGraduation: false,
    stateful: true,
    params: [
      { name: "sensePpm", bits: "0..23", type: "uint24", range: "1 .. 1000000", meaning: "fraction of the spread charged" },
      { name: "capPpm", bits: "24..47", type: "uint24", range: "1 .. 100000" },
      { name: "tauSeconds", bits: "48..79", type: "uint32", range: "60 .. 31536000", meaning: "anchor refresh time" },
      { name: "mode", bits: "80..87", type: "uint8", range: "0 roll, 1 spread" },
    ],
    worked:
      "sensePpm 250000 (charge a quarter of the spread), capPpm 15000, tau 21600 (six hours), mode 0. A 4% dislocation against a six hour memory costs the paying side 1%.",
    sourceFile: "contracts/src/traits/TermTrait.sol",
  },
  {
    slug: "quota",
    name: "Quota",
    family: "supply",
    tagline: "A producer decides how much leaves the ground, and wanting more is the whole history of commodity markets",
    blurb:
      "Supply is not a number, it is a decision. A cartel meets, agrees a quota, and the world discovers what the marginal barrel costs when the taps are only open so far. OPEC has run that experiment since 1960 and it works in both directions. And seasons are real: heating oil is not the same product in January and July. This trait gives a launch a production rate instead of an inventory. In each epoch only so much supply may leave at the ordinary price. Buying inside the quota costs nothing extra; buying past it costs more, rising with how far past you are. Nothing is ever forbidden. You can always have more, you just have to outbid the quota. That is what a cartel actually sells.",
    points: [
      "Buys consume quota, sells do not replenish it. Metal coming back to the warehouse is not the mine running backwards.",
      "Seasons run on absolute time, not launch time: the quarter index is (timestamp / 7889400) % 4, so every launch carrying this trait is always in the same season at the same moment.",
      "The size measurement is deliberately conservative. It overstates the tokens that leave, which makes the quota bind sooner, which is the safe direction for a supply cap.",
      "Never refuses. Inert after graduation, because a closed mine has no throughput to meter.",
    ],
    side: "buys",
    canRefuse: false,
    inertAfterGraduation: true,
    stateful: true,
    params: [
      { name: "quotaPpm", bits: "0..23", type: "uint24", range: "1 .. 1000000", meaning: "supply releasable per epoch" },
      { name: "overPpm", bits: "24..47", type: "uint24", range: "1 .. 100000", meaning: "charge at one full quota over" },
      { name: "epochSeconds", bits: "48..79", type: "uint32", range: "3600 .. 31536000" },
      { name: "seasonPct Q0..Q3", bits: "80..111", type: "uint8 x4", range: "1 .. 255", meaning: "percent multiplier on the quota" },
    ],
    worked:
      "quotaPpm 20000 (2% of supply a day), overPpm 40000, epochSeconds 86400, seasons 100/100/100/160. Ordinary three quarters of the year and a 60% wider tap in the fourth, roughly what a heating season does to distillate.",
    sourceFile: "contracts/src/traits/QuotaTrait.sol",
  },
  {
    slug: "null",
    name: "Null",
    family: "reference",
    tagline: "A trait that expresses nothing about the underlying, on purpose",
    blurb:
      "Charges zero, writes nothing, refuses nothing. It exists so a launch can occupy a trait slot without asserting anything, and so the test suite has a known-inert module to measure the others against. It accepts only the zero word as its parameter, because a no-op trait has no configuration and a non-zero parameter is a launcher believing something that is not true.",
    points: [
      "Accepts only the zero parameter word, so a misconfiguration is caught before it is frozen forever.",
      "Zero fee, zero state, never refuses.",
    ],
    side: "both",
    canRefuse: false,
    inertAfterGraduation: false,
    stateful: false,
    params: [],
    sourceFile: "contracts/src/traits/NullTrait.sol",
  },

  /* ------------------------------------------------------------------------
     The second wave. Every one of these prices a rule a real exchange
     publishes, rather than a physical metaphor, and the copy below is
     condensed from each contract's own header.
     ------------------------------------------------------------------------ */

  {
    slug: "impact",
    name: "Impact",
    family: "physical",
    tagline: "A big order moves the price against you, and the merchant prices the move rather than the order",
    blurb:
      "A warehouse that sells you a thousand tonnes does not charge you a thousand times the one-tonne price. It charges you for what taking a thousand tonnes does to the price of the next tonne. Every dealer in every physical market has priced this forever, and it is the one thing a bonding curve does not do on its own: the curve makes a large trade expensive through slippage, but it hands the whole of that move to whoever arrives next, for free. This structure takes half of it back. An arbitrageur closing a divergence from P to M fills at roughly the geometric mean, so their profit is about half the divergence, so a fee of half the impact captures the profit and leaves the trade.",
    points: [
      "Ported from dennnis0204/slippage-fee-hook, live on Arbitrum One. The original opens poolManager.unlock, executes the real swap, reads slot0, then deliberately reverts to recover the tick, because a concentrated-liquidity pool has no closed form for its post-trade price. This curve does, so a nested swap and a deliberate revert collapse into arithmetic on Ctx.",
      "It charges the PRICE MOVE and not execution slippage. The move is ((R + x)/R)^2 - 1 and slippage is 1 - 1/(1 + x/R). They differ by about 2x at small size and diverge without limit.",
      "Symmetric in shape, not in number. A buy's ratio is above one and a sell's below it, so the impact is r^2 - 1 on one side and 1 - r^2 on the other, and a single branch would be wrong on the sell side by the whole difference.",
      "The ratio is clamped before it is squared. Without that, a maximal trade against a small reserve overflows uint256 while every sane fuzz case passes.",
    ],
    side: "both",
    canRefuse: false,
    inertAfterGraduation: false,
    stateful: false,
    params: [
      { name: "sharePpm", bits: "0..23", type: "uint24", range: "1 .. 1000000", meaning: "fraction of the impact charged" },
      { name: "capPpm", bits: "24..47", type: "uint24", range: "1 .. 600000" },
      { name: "floorPpm", bits: "48..71", type: "uint24", range: "0 .. 600000", meaning: "charged on any billable trade" },
      { name: "minSizePpm", bits: "72..95", type: "uint24", range: "0 .. 1000000", meaning: "size below which it is free" },
    ],
    worked:
      "The original's own configuration: sharePpm 500000, capPpm 50000, floorPpm 100, minSizePpm 0. A trade taking 1% of the reserve moves the price about 2.01% and pays about 1.005%. One taking 10% moves it 21% and would pay 10.5%, which the 5% cap holds at 5%.",
    sourceFile: "contracts/src/traits/ImpactTrait.sol",
  },
  {
    slug: "oddlot",
    name: "OddLot",
    family: "supply",
    tagline: "Breaking a lot to fill a small order costs the warehouse something, and exchanges used to charge for it by name",
    blurb:
      "A warehouse deals in lots. A tonne, a bar, a contract, a round hundred shares. Filling an order for less than a lot means breaking one open, and the broken remainder is worth less than the whole was, so somebody pays for the break. The NYSE charged this by name for most of the twentieth century and called it the odd-lot differential: a surcharge on any order below the round lot, quoted separately from the commission. It is the only mechanic in this directory whose fee FALLS as the trade grows, and that inversion is the entire point. Every other fee here makes size expensive. This one makes dust expensive, because dust is what actually costs a warehouse money.",
    points: [
      "It cannot be gamed by splitting, which is the first thing anybody asks. A trader at or above the round lot pays zero, so splitting into pieces below the lot makes every piece pay. A trader already below the lot pays MORE per piece and the pieces still sum to the same shortfall. The only way to pay less is to trade a rounder number.",
      "Monotone non-increasing in size, so there is no local minimum anywhere for a bot to sit in.",
      "The lot is a fraction of tRes rather than an absolute token count, so it means the same thing in every launch. It shrinks as the curve is bought out, which is the correct direction: a thinner warehouse breaks smaller lots.",
      "No production source. The market practice is real, documented and named; the shape and every parameter are ours, and the contract header says so rather than implying a provenance it does not have.",
    ],
    side: "both",
    canRefuse: false,
    inertAfterGraduation: false,
    stateful: false,
    params: [
      { name: "oddPpm", bits: "0..23", type: "uint24", range: "1 .. 600000", meaning: "the differential at zero size" },
      { name: "roundLotPpm", bits: "24..47", type: "uint24", range: "1 .. 1000000", meaning: "the lot, as ppm of tRes" },
      { name: "capPpm", bits: "48..71", type: "uint24", range: "1 .. 600000" },
    ],
    worked:
      "oddPpm 20000, roundLotPpm 1000 (0.1% of tRes), capPpm 20000. An order at exactly the lot pays nothing, at half the lot 1%, at a tenth of the lot 1.8%, and dust pays the full 2% and stops being worth sending.",
    sourceFile: "contracts/src/traits/OddLotTrait.sol",
  },
  {
    slug: "uptick",
    name: "Uptick",
    family: "delivery",
    tagline: "Once a market has fallen far enough, pressing it down further costs money",
    blurb:
      "This is the oldest live rule in American equities. From 1938 to 2007 you could not sell a share short unless the last price change had been upward, which is where the name comes from. The SEC repealed it, watched 2008 happen, and put back a narrower version in 2010: Rule 201, the alternative uptick rule. A stock that falls 10% from the previous day's close goes into a restricted state, and for the rest of that day and the whole of the next one a short sale may only be posted above the national best bid. You can still sell. You just cannot be the one who hits the bid on the way down. Every one of the 193 assets on this chain lives under that rule in its home market.",
    points: [
      "Asymmetric, and that is the entire mechanic. Buys are free at every depth of decline. The rule exists to make it costly to press a market down and free to support it.",
      "It prices the market the sale LEAVES BEHIND, not the one the trader found. On constant product that is a closed form and no venue read is needed.",
      "The reference is the session's first print, which on this venue IS the prior close: the price only moves when somebody trades, so there is no overnight tape and no gap.",
      "Autostart. A launch that fell 30% then went quiet for a month would otherwise charge the maximum forever on the first trade back. A gap longer than staleSessions discards the anchor, charges nothing and reseeds. Bunni found this in production; the fix is taken rather than rediscovered.",
      "One deliberate departure from the real rule, stated rather than buried: Rule 201 LATCHES for the rest of the day and all of the next. This lifts as soon as the price recovers, because a latch under a fee-only design is a toll on the recovery.",
    ],
    side: "sells",
    canRefuse: false,
    inertAfterGraduation: false,
    stateful: true,
    params: [
      { name: "triggerPpm", bits: "0..23", type: "uint24", range: "1 .. 999999", meaning: "decline that arms the rule" },
      { name: "slopePpm", bits: "24..47", type: "uint24", range: "1 .. 1000000", meaning: "fee per unit of excess decline" },
      { name: "stepPpm", bits: "48..71", type: "uint24", range: "0 .. capPpm", meaning: "flat charge on arming" },
      { name: "capPpm", bits: "72..95", type: "uint24", range: "1 .. 600000" },
      { name: "sessionSec", bits: "96..127", type: "uint32", range: "3600 .. 604800" },
      { name: "staleSessions", bits: "128..135", type: "uint8", range: "1 .. 7", meaning: "the autostart threshold" },
    ],
    worked:
      "The rule as the SEC writes it: triggerPpm 100000 (the real 10%), slopePpm 1000000, stepPpm 0, capPpm 60000, sessionSec 86400, staleSessions 2. Nothing down to a 10% decline. At 12% the sale pays 2%, at 16% it pays 6% and the cap holds it there. A buy pays nothing at any depth.",
    sourceFile: "contracts/src/traits/UptickTrait.sol",
  },
  {
    slug: "lockup",
    name: "Lockup",
    family: "supply",
    tagline: "The date the insiders are allowed to sell is on the calendar from day one",
    blurb:
      "When a company goes public, the people who already owned it are not allowed to sell. The underwriting agreement locks them up, almost always for 180 days, and quite often in two pieces. Everybody knows the date. It is in the prospectus, it is on every calendar on every desk on the street, and on the morning it expires the float can double. What happens then is one of the most studied events in finance: volume jumps, the spread widens, and the price drifts down by a low single-digit percentage around the unlock even though the date was public for six months. The market knows, and it still costs something, because knowing a lot of stock is coming and having somewhere to put it are different problems.",
    points: [
      "Asymmetric. Sells pay, buys are free. An unlock is a one-directional flow: the released holders are sellers and the buyer is the party providing the liquidity the unlock needs.",
      "Stateless and completely predictable. Everything is measured from launchedAt, which is frozen, so a UI can draw every future day of the schedule at launch, years out.",
      "Two cliffs, and overlaps take the maximum rather than the sum. Two tranches landing in the same week is still one crowded exit as far as a price is concerned.",
      "No anticipation ramp, deliberately. A charge that begins before the event is indistinguishable in shape from the launch-window taper this project explicitly dropped, and once a structure can charge before a date it is one parameter away from charging from block one.",
    ],
    side: "sells",
    canRefuse: false,
    inertAfterGraduation: false,
    stateful: false,
    params: [
      { name: "peak1Ppm", bits: "0..23", type: "uint24", range: "1 .. capPpm", meaning: "charge at the first unlock" },
      { name: "day1", bits: "24..39", type: "uint16", range: "1 .. 3650", meaning: "days from launch to it" },
      { name: "peak2Ppm", bits: "40..63", type: "uint24", range: "0 .. capPpm", meaning: "charge at the second unlock" },
      { name: "day2", bits: "64..79", type: "uint16", range: "0 .. 3650", meaning: "0 means there is no second one" },
      { name: "taperDays", bits: "80..95", type: "uint16", range: "1 .. 365", meaning: "how long each cliff takes to fade" },
      { name: "capPpm", bits: "96..119", type: "uint24", range: "1 .. 600000" },
    ],
    worked:
      "The ordinary underwriting agreement: peak1Ppm 30000, day1 180, peak2Ppm 0, day2 0, taperDays 14, capPpm 30000. Nothing for 180 days, then a sale costs 3% on day 180, 1.5% on day 187, and nothing from day 194 onward. The staged version for a hot listing is peak1Ppm 10000 at day 90 and peak2Ppm 30000 at day 180.",
    sourceFile: "contracts/src/traits/LockupTrait.sol",
  },
  {
    slug: "witching",
    name: "Witching",
    family: "term",
    tagline: "Four days a year, everything expires at once, and the whole market knows it",
    blurb:
      "On the third Friday of March, June, September and December, stock index futures, stock index options and single stock options all expire on the same morning. The street has called it triple witching since the 1980s. On those four days the closing volume is a multiple of an ordinary day's, the rebalancing prints go through at the bell, and the spread on everything widens because every dealer on the desk is unwinding a hedge against a settlement print rather than making a market. It is not a crisis and nobody is surprised by it. It is a scheduled congestion event, four times a year, on a date that has been known since the exchange listed the contract.",
    points: [
      "The coupling is the point, not a side effect. Every other structure keys off something private to its own launch. This one keys off nothing but the calendar, so every launch carrying it fires on the same four days at the same instant, venue-wide, which is precisely what happens in the real market.",
      "Symmetric. An expiry widens the spread, and a spread is not directional.",
      "The date arithmetic is exact and embedded, with no table: days-from-civil inverted, and the weekday from (days + 4) % 7 because 1 January 1970 was a Thursday. Nothing here can go stale, because the third Friday of March is the third Friday of March forever.",
      "One stated inaccuracy: tzOffsetMin is a fixed offset with no daylight saving table, so for part of the year the day boundary is an hour out. The error lands at midnight local, which is the least interesting hour of an expiry day.",
    ],
    side: "both",
    canRefuse: false,
    inertAfterGraduation: false,
    stateful: false,
    params: [
      { name: "witchPpm", bits: "0..23", type: "uint24", range: "1 .. capPpm", meaning: "charged on the expiry itself" },
      { name: "evePpm", bits: "24..47", type: "uint24", range: "0 .. witchPpm", meaning: "charged on the run-up" },
      { name: "capPpm", bits: "48..71", type: "uint24", range: "1 .. 600000" },
      { name: "eveDays", bits: "72..79", type: "uint8", range: "0 .. 7", meaning: "length of the run-up, 0 for none" },
      { name: "monthly", bits: "80..87", type: "uint8", range: "0 or 1", meaning: "0 quarterly only, 1 every month" },
      { name: "tzOffsetMin", bits: "88..103", type: "uint16", range: "0 .. 2880", meaning: "local offset in minutes, plus 1440" },
    ],
    worked:
      "Triple witching on New York time: witchPpm 20000, evePpm 5000, capPpm 20000, eveDays 2, monthly 0, tzOffsetMin 1140 (which is minus 300 minutes). Four days a year at 2%, eight more at 0.5%, and 353 days at nothing.",
    sourceFile: "contracts/src/traits/WitchingTrait.sol",
  },
  {
    slug: "borrow",
    name: "Borrow",
    family: "supply",
    tagline: "What the last available share costs is not what the first one cost",
    blurb:
      "A securities lending desk quotes two completely different worlds under one name. Most of the market is general collateral: the shares are everywhere, the rate is a few basis points, and nobody thinks about it. Then a name goes special. The lendable float shrinks, the rate stops being a rounding error, and it does not rise in a straight line. It goes hyperbolic, because the price of the last available share is set by the fact that there is no other one. GameStop's borrow rate reached triple digits annualised in January 2021, on the same desk and the same contract that had been quoting a fraction of a percent a month earlier. A launch here has a lendable float and it is not a metaphor: tRes is the stock still on the shelf and supply is how much there ever was.",
    points: [
      "The rate is set on the float you LEAVE BEHIND, not the one you found. A buy that takes half of what is left is not entitled to the rate that applied before it took it, so the order that empties the shelf pays the empty-shelf rate.",
      "Hyperbolic, not kinked. Compound's borrow curve is piecewise linear with a kink; this is easy * pivot / float, which has no kink, no cliff and no boundary to stand exactly on. A scarcity price behaves like one over the remaining supply, not like a line with a bend in it.",
      "Which side is the borrower, since somebody will ask: there is no short here, no lending and no locate. What there is, is a warehouse whose lendable float is shrinking, and the party removing the last of it is the BUYER. So the buyer pays.",
      "An empty shelf charges the cap rather than dividing by zero, which is the first thing anybody looks for in a hyperbola.",
      "The cheapest structure in the directory after Null. Everything comes out of tRes and supply, both already in Ctx, and it writes no state.",
    ],
    side: "buys",
    canRefuse: false,
    inertAfterGraduation: false,
    stateful: false,
    params: [
      { name: "easyPpm", bits: "0..23", type: "uint24", range: "1 .. capPpm", meaning: "the general collateral rate" },
      { name: "pivotPpm", bits: "24..47", type: "uint24", range: "1 .. 1000000", meaning: "float at which it stops being easy" },
      { name: "capPpm", bits: "48..71", type: "uint24", range: "1 .. 600000" },
      { name: "sideMode", bits: "72..79", type: "uint8", range: "0 or 1", meaning: "0 buys only, 1 both sides" },
    ],
    worked:
      "The header proposes easyPpm 500, pivotPpm 250000, capPpm 60000, sideMode 0, on the stated grounds that the supply split leaves 25% of the tokens in the curve at graduation. IT LEAVES 40%, so that pivot is never reached and the structure charges its flat 5 bps for the whole life of the launch. The composer refuses to freeze that quietly. A pivot above the graduation float, 700000 for instance, is the working version.",
    sourceFile: "contracts/src/traits/BorrowTrait.sol",
  },
  {
    slug: "cross",
    name: "Cross",
    family: "term",
    tagline: "A real exchange does not open by trading. It opens by crossing",
    blurb:
      "The New York Stock Exchange does not start the day by matching the first two orders that arrive. It runs an opening auction: orders accumulate, an indicative price is published, and at the bell everything crosses at one price. It ends the day the same way, and the closing cross is now the single largest liquidity event on the tape, because every index fund on earth has to print at the official close. The shape is the oldest finding in market microstructure and it has a name: the intraday U. Spreads and volatility are widest at the open, narrow through the middle of the session, and widen again into the close. At the open nobody knows where the price is yet; into the close everybody with an on-close obligation is trying to discharge it against everybody else's imbalance.",
    points: [
      "Two ramps facing opposite ways, which is the whole design. The opening charge is largest at the bell and TAPERS DOWN as uncertainty resolves. The closing charge RAMPS UP as the imbalance builds into the cross. Making both decay would get one end of the U backwards.",
      "Symmetric. An auction is a crossing, not a direction.",
      "Stateless. The whole answer is (ts + phase) mod session, so a launch that has not traded for a year gets exactly the same schedule as one that trades every block.",
      "validate holds openSec + closeSec to half the session, so there is always a continuous middle that costs nothing.",
      "This is not a privileged-window toll. There is no cheap window: the middle of the session is the free part and the auctions are what cost.",
    ],
    side: "both",
    canRefuse: false,
    inertAfterGraduation: false,
    stateful: false,
    params: [
      { name: "sessionSec", bits: "0..31", type: "uint32", range: "3600 .. 604800" },
      { name: "phaseSec", bits: "32..63", type: "uint32", range: "0 .. sessionSec - 1" },
      { name: "openSec", bits: "64..79", type: "uint16", range: "0 .. 65535", meaning: "length of the opening cross" },
      { name: "openPpm", bits: "80..103", type: "uint24", range: "0 .. capPpm", meaning: "charge at the bell" },
      { name: "closeSec", bits: "104..119", type: "uint16", range: "0 .. 65535", meaning: "length of the closing cross" },
      { name: "closePpm", bits: "120..143", type: "uint24", range: "0 .. capPpm", meaning: "charge in the last second" },
      { name: "capPpm", bits: "144..167", type: "uint24", range: "1 .. 600000" },
    ],
    worked:
      "A daily session on New York's clock, both auctions priced: sessionSec 86400, phaseSec 37800, openSec 900, openPpm 15000, closeSec 600, closePpm 20000, capPpm 20000. The first second after the bell costs 1.5% and is gone fifteen minutes later, the middle twenty-three hours cost nothing, and the last second before the next bell costs 2%, which is the real ordering.",
    sourceFile: "contracts/src/traits/CrossTrait.sol",
  },
  {
    slug: "breaker",
    name: "Breaker",
    family: "physical",
    tagline: "The market-wide circuit breaker, with the halt replaced by a price",
    blurb:
      "Every US exchange runs the same three numbers. If the S&P 500 falls 7% against the previous session's close, trading stops everywhere for fifteen minutes. If it falls 13%, it stops again. If it falls 20%, the day is over. Three tiers, minus seven, minus thirteen, minus twenty, written into Rule 80B after 1987 and rewritten to those levels after 2010. They have been used: 9 March 2020, 12 March, 16 March, 18 March, four Level 1 halts in eight trading days. The tiers are not a scale, they are steps. Nothing happens at 6.9% and the whole market stops at 7.0%, which is the point. This structure keeps the three tiers and throws away the halt.",
    points: [
      "The tiers are constants, not parameters. A launcher chooses what each tier COSTS and nothing else, because the whole value of the structure is that the numbers in it are the numbers in the rulebook.",
      "Symmetric, deliberately. Uptick is the one-sided price test and the pair is only coherent read together: Rule 201 restricts short sales and touches nobody else, Rule 80B halts the entire market and touches everybody.",
      "The trade that lifts the price back above a tier is charged at the tier it LEAVES, so the bid that repairs the breach escapes it. That is the one thing a real halt cannot do.",
      "Autostart, with the same reasoning as Uptick. A launch that fell 25% then went quiet would otherwise charge the third tier forever. A halt that never lifts is not a breaker, it is a delisting.",
    ],
    side: "both",
    canRefuse: false,
    inertAfterGraduation: false,
    stateful: true,
    params: [
      { name: "l1Ppm", bits: "0..23", type: "uint24", range: "1 .. capPpm", meaning: "charged at -7% or worse" },
      { name: "l2Ppm", bits: "24..47", type: "uint24", range: "l1 .. capPpm", meaning: "charged at -13% or worse" },
      { name: "l3Ppm", bits: "48..71", type: "uint24", range: "l2 .. capPpm", meaning: "charged at -20% or worse" },
      { name: "capPpm", bits: "72..95", type: "uint24", range: "1 .. 600000" },
      { name: "sessionSec", bits: "96..127", type: "uint32", range: "3600 .. 604800" },
      { name: "staleSessions", bits: "128..135", type: "uint8", range: "1 .. 7", meaning: "the autostart threshold" },
    ],
    worked:
      "l1Ppm 5000, l2Ppm 25000, l3Ppm 100000, capPpm 100000, sessionSec 86400, staleSessions 1. An ordinary 5% day costs nothing. A 2020-shaped 8% day costs half a percent a side. A day that takes the launch down 21% costs ten percent to trade at all, in either direction.",
    sourceFile: "contracts/src/traits/BreakerTrait.sol",
  },
  {
    slug: "exdiv",
    name: "ExDiv",
    family: "term",
    tagline: "On one specific morning a quarter, the price is lower and nothing has gone wrong",
    blurb:
      "A dividend is the only scheduled discontinuity in an equity price. On the ex-dividend date the stock opens lower by roughly the dividend, because the buyer that morning is buying something that no longer carries the payment. Exchanges adjust every resting limit order for it overnight. It is arithmetic, it is on the calendar months in advance, and nobody calls it a crash. The awkward part is the one this structure prices: the underlying steps down on a known date, and the curve does not, because a curve moves when somebody trades it and for no other reason. For the hours around the step there is a book quoting a claim on an asset that just got smaller.",
    points: [
      "The cliff is deliberate, which is unusual here. The general case against thresholds is right about fee curves approximating something continuous. This is not one: the dividend IS a cliff, and smoothing the charge into the run-up would be modelling something that does not happen. The far edge is continuous because that side genuinely is a taper.",
      "Symmetric. One side is buying a claim about to shrink and the other is selling one that already has, and which of them is wrong depends entirely on where in the window the trade lands.",
      "It does not know a dividend was paid and does not pretend to. There is no oracle in this project. What it has is a schedule frozen at launch, and if the real issuer changes the calendar the schedule is wrong and stays wrong: a bounded, capped, fee-shaped wrongness rather than a pool that stops working on a date nobody can change.",
      "GLD, SLV and USO never step, because a bar of metal does not pay you anything, and a launcher against those should not install this.",
    ],
    side: "both",
    canRefuse: false,
    inertAfterGraduation: false,
    stateful: false,
    params: [
      { name: "stepPpm", bits: "0..23", type: "uint24", range: "1 .. capPpm", meaning: "charge at the ex-instant" },
      { name: "capPpm", bits: "24..47", type: "uint24", range: "1 .. 600000" },
      { name: "periodDays", bits: "48..63", type: "uint16", range: "1 .. 3650", meaning: "the distribution cycle" },
      { name: "windowHours", bits: "64..79", type: "uint16", range: "1 .. 6 * periodDays" },
      { name: "phaseDays", bits: "80..95", type: "uint16", range: "0 .. 3650", meaning: "launch to the first ex-date" },
    ],
    worked:
      "The charge is meant to be the size of the step, so it is arithmetic on the underlying's own published distribution. A broad index fund yielding about 1.3% and paying quarterly steps about 3250 ppm: stepPpm 3250, capPpm 5000, periodDays 91, windowHours 12, phaseDays 30. A dividend fund at about 3.6% is 9000 ppm a step. A treasury fund distributing monthly at about 4.2% is 3500 ppm on a 30 day cycle.",
    sourceFile: "contracts/src/traits/ExDivTrait.sol",
  },
  {
    slug: "tickregime",
    name: "TickRegime",
    family: "physical",
    tagline: "A price that cannot move by a tick has not moved, and quoting it anyway is the thing exchanges charge for",
    blurb:
      "Every regulated market quantises its prices. You cannot bid 50.0037 for a share; there is a minimum increment and it is set by rule. MiFID II wrote the European table into RTS 11 in 2018, and the SEC ran a two-year Tick Size Pilot that widened the increment to five cents for hundreds of small caps and measured what happened. Both were arguing about the same thing. A tick that is too fine lets anybody step in front of a resting order for a fraction of a cent they never really paid; a tick that is too coarse makes the spread artificially wide. The finding that survived both regimes is the interesting one: below the tick, activity is not price discovery, it is noise. A bonding curve has no tick at all. This gives it one.",
    points: [
      "It is the only structure here that prices the MOVE rather than the size, with the sign inverted. Impact charges half the price move and rises with it; this charges the shortfall against one tick and falls with it. A launcher can coherently install both.",
      "It is not OddLot, though both fall with size. OddLot measures a QUANTITY against a lot; this measures a PRICE MOVE against a tick. The same order in a pool with twice the reserve moves the price half as far, so it is odd-lot-identical and tick-different.",
      "The sawtooth version was considered and rejected. Charging the sub-tick remainder is a better metaphor and a worse mechanic: it is not monotone, so it puts a local minimum at every whole tick for a bot to sit in.",
      "Symmetric. A tick is a tick in both directions.",
    ],
    side: "both",
    canRefuse: false,
    inertAfterGraduation: false,
    stateful: false,
    params: [
      { name: "tickPpm", bits: "0..23", type: "uint24", range: "1 .. 100000", meaning: "the minimum increment, ppm of price" },
      { name: "noisePpm", bits: "24..47", type: "uint24", range: "1 .. capPpm", meaning: "charge on a trade that moves nothing" },
      { name: "capPpm", bits: "48..71", type: "uint24", range: "1 .. 600000" },
    ],
    worked:
      "A penny tick on a fifty dollar share is 200 ppm of price, which is what most of the equities on this chain quote in: tickPpm 200, noisePpm 3000, capPpm 3000. A trade moving the price a full 200 ppm or more pays nothing, one moving it 100 ppm pays 0.15%, and one moving it nothing pays 0.3% and stops being worth sending. A nickel tick is 1000 ppm on the same share.",
    sourceFile: "contracts/src/traits/TickRegimeTrait.sol",
  },
];

export const TRAIT_BY_SLUG = new Map(TRAITS.map((t) => [t.slug, t]));

export function traitsInFamily(family: TraitFamily): Trait[] {
  return TRAITS.filter((t) => t.family === family);
}

/** FourthStreetHook.MAX_TRAITS. Four slots, chosen at launch and frozen. */
export const MAX_TRAITS = 4;
