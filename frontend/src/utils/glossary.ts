export type GlossaryEntry = {
  label: string;
  whatItIs: string;
  whatItDoes: string;
  howItsUsed: string;
};

export const glossary = {
  // Identity & Holdings
  portfolio: {
    label: 'Portfolio',
    whatItIs: 'A collection of investments — like stocks, bonds, or funds — that someone owns together.',
    whatItDoes: 'Gives you a full picture of what you own, so you can see how all your investments are doing as a group.',
    howItsUsed: 'Each portfolio in this dashboard has its own page showing its holdings, performance, and risk.',
  },
  aum: {
    label: 'AUM (Assets Under Management)',
    whatItIs: 'The total dollar value of all the investments inside a portfolio at this moment.',
    whatItDoes: 'Tells you how big the portfolio is, like checking the total balance of a bank account.',
    howItsUsed: 'Displayed as the headline number on each portfolio card so you can quickly see its size.',
  },
  marketValue: {
    label: 'Market Value',
    whatItIs: 'What a holding is worth right now if you sold it at today\'s price.',
    whatItDoes: 'Shows the current real-world value of an investment, which changes every day as prices move.',
    howItsUsed: 'Listed next to each holding in the portfolio table so you can see how much each position is worth today.',
  },
  holding: {
    label: 'Holding',
    whatItIs: 'A single investment inside a portfolio — for example, 100 shares of Apple.',
    whatItDoes: 'Represents one piece of the portfolio puzzle, tracking how much you own and what it\'s worth.',
    howItsUsed: 'Each row in the Holdings table is one holding, showing its name, quantity, and current value.',
  },
  security: {
    label: 'Security',
    whatItIs: 'A tradable financial asset — most commonly a stock (ownership in a company) or a bond (a loan to a company or government).',
    whatItDoes: 'Identifies the specific thing being bought or sold, so the portfolio knows exactly what it holds.',
    howItsUsed: 'Used interchangeably with "holding" in this dashboard to refer to any individual investment.',
  },
  ticker: {
    label: 'Ticker',
    whatItIs: 'A short code, usually 1–5 letters, that identifies a specific stock or fund on an exchange — like "AAPL" for Apple.',
    whatItDoes: 'Acts like a license plate for a security so computers and traders can identify it instantly without confusion.',
    howItsUsed: 'Shown in the Holdings table next to each security name so you can quickly look it up.',
  },
  sector: {
    label: 'Sector',
    whatItIs: 'A broad category grouping companies that do similar things — like "Technology", "Healthcare", or "Energy".',
    whatItDoes: 'Helps you see whether your investments are spread across different industries or concentrated in one area.',
    howItsUsed: 'Used in sector breakdown charts to show how much of the portfolio is in each industry.',
  },
  assetClass: {
    label: 'Asset Class',
    whatItIs: 'A major category of investment type — the most common are stocks (equities), bonds (fixed income), and cash.',
    whatItDoes: 'Different asset classes behave differently — stocks tend to grow more but swing wildly; bonds are steadier. Mixing them reduces risk.',
    howItsUsed: 'Shown in allocation charts to illustrate how the portfolio is divided between stocks, bonds, and other types.',
  },
  weight: {
    label: 'Weight',
    whatItIs: 'The percentage of the total portfolio that a single holding or sector makes up.',
    whatItDoes: 'Tells you how important each piece is — a 20% weight means that one holding drives a big chunk of your results.',
    howItsUsed: 'Displayed for each holding so you can see which positions are the biggest bets in the portfolio.',
  },
  targetWeight: {
    label: 'Target Weight',
    whatItIs: 'The intended percentage that a holding or sector is supposed to make up in the portfolio.',
    whatItDoes: 'Acts as a goal — the manager decided in advance how much of each thing to hold, and this is that plan.',
    howItsUsed: 'Compared to the actual weight to show whether the portfolio has drifted away from its strategy.',
  },
  weightDrift: {
    label: 'Weight Drift',
    whatItIs: 'The gap between where a holding is now and where it was supposed to be.',
    whatItDoes: 'Flags when market moves have pushed the portfolio off its intended plan, which might mean it\'s time to rebalance.',
    howItsUsed: 'Highlighted in the Holdings table — positive drift means a position grew larger than intended, negative means it shrank.',
  },
  costBasis: {
    label: 'Cost Basis',
    whatItIs: 'The original price paid for an investment, used as the starting point to calculate profit or loss.',
    whatItDoes: 'Lets you know whether an investment is currently making or losing money compared to what was paid.',
    howItsUsed: 'Shown alongside market value in the Holdings table so you can see unrealized gains or losses at a glance.',
  },
  benchmark: {
    label: 'Benchmark',
    whatItIs: 'A standard index (like the S&P 500) used as a yardstick to judge how well a portfolio is doing.',
    whatItDoes: 'Answers the question: "Did the portfolio beat the market, or would you have done just as well with a simple index fund?"',
    howItsUsed: 'Each portfolio is compared to its assigned benchmark on the Performance and Dashboard pages.',
  },
  quantity: {
    label: 'Quantity',
    whatItIs: 'The number of shares or units of a security that the portfolio owns.',
    whatItDoes: 'Combined with the current price, it determines the total market value of that holding.',
    howItsUsed: 'Listed in the Holdings table so you can see exactly how many units are held.',
  },
  currency: {
    label: 'Currency',
    whatItIs: 'The money type (e.g., Canadian dollars or US dollars) that a security is priced in.',
    whatItDoes: 'Matters because a stock priced in USD has a different value to a Canadian investor than one priced in CAD.',
    howItsUsed: 'Shown on holdings to indicate which currency is used for pricing and reporting.',
  },
  strategy: {
    label: 'Strategy',
    whatItIs: 'The investment approach or plan that guides how a portfolio is built and managed.',
    whatItDoes: 'Defines the rules — for example, "buy dividend-paying stocks" or "balance growth and safety" — that shape every decision.',
    howItsUsed: 'Each portfolio in this dashboard is tagged with a strategy name so you can understand its investment style.',
  },
  inceptionDate: {
    label: 'Inception Date',
    whatItIs: 'The date a portfolio officially started — the day it was launched and first invested.',
    whatItDoes: 'Sets the starting point for all "since inception" performance calculations.',
    howItsUsed: 'Shown on portfolio detail pages so you know how long the portfolio has been running.',
  },
  asOfDate: {
    label: 'As-of Date',
    whatItIs: 'The date the data was last updated — in other words, how fresh the numbers are.',
    whatItDoes: 'Tells you whether you\'re looking at today\'s data or a snapshot from a previous day.',
    howItsUsed: 'Displayed at the top of charts and tables so you know exactly when the information was last refreshed.',
  },

  // Returns
  dailyReturn: {
    label: 'Daily Return',
    whatItIs: 'How much the portfolio went up or down on a single day, shown as a percentage.',
    whatItDoes: 'Gives you a day-by-day heartbeat of performance — positive means the portfolio grew, negative means it shrank.',
    howItsUsed: 'Plotted on the performance chart so you can see which days were good or bad.',
  },
  cumulativeReturn: {
    label: 'Cumulative Return',
    whatItIs: 'The total percentage gain or loss since a chosen start date, with all daily moves stacked together.',
    whatItDoes: 'Shows the big picture — if you started with $1,000, this tells you how much it has grown to overall.',
    howItsUsed: 'Shown as the main performance line on charts, letting you compare the portfolio\'s journey against its benchmark.',
  },
  annualizedReturn: {
    label: 'Annualized Return',
    whatItIs: 'The average yearly return, even if the period being measured is shorter or longer than one year.',
    whatItDoes: 'Makes different time periods comparable — like expressing a recipe in servings per person regardless of batch size.',
    howItsUsed: 'Displayed in the performance summary table so you can compare strategies on equal footing.',
  },
  excessReturn: {
    label: 'Excess Return',
    whatItIs: 'The extra return the portfolio earned above what its benchmark returned over the same period.',
    whatItDoes: 'Answers "Did the manager add value?" — a positive number means they beat the market, negative means they lagged.',
    howItsUsed: 'Shown alongside benchmark returns on the Performance page so you can see manager skill at a glance.',
  },

  // Risk
  volatility: {
    label: 'Volatility',
    whatItIs: 'A measure of how much an investment\'s value jumps around — like a calm lake versus a stormy sea.',
    whatItDoes: 'Higher volatility means bigger swings up and down, which can feel scary even if the long-run direction is good.',
    howItsUsed: 'Displayed on the Risk page as a key measure of how bumpy the portfolio\'s ride has been.',
  },
  annualizedVolatility: {
    label: 'Annualized Volatility',
    whatItIs: 'Volatility scaled to a one-year timeframe so it\'s easy to compare across portfolios.',
    whatItDoes: 'Puts all risk numbers on the same annual yardstick, like converting speeds to miles-per-hour regardless of the trip length.',
    howItsUsed: 'Shown in the risk summary cards so you can compare how wild different portfolios are on the same scale.',
  },
  rollingVolatility: {
    label: 'Rolling Volatility',
    whatItIs: 'Volatility measured over a moving window of recent days, recalculated each day as time moves forward.',
    whatItDoes: 'Shows how risk has changed over time — useful for spotting when a portfolio got suddenly more or less turbulent.',
    howItsUsed: 'Plotted as a line chart on the Risk page so you can see when periods of calm turned into turbulence.',
  },
  sharpeRatio: {
    label: 'Sharpe Ratio',
    whatItIs: 'A score that compares how much money an investment made to how bumpy the ride was getting there.',
    whatItDoes: 'Tells you whether the returns were worth the risk. Higher is better — above 1 is good, above 2 is great.',
    howItsUsed: 'Shown on the Dashboard and Risk page so you can tell a smooth, steady earner apart from a wild gambler — even if both ended up at the same place.',
  },
  maxDrawdown: {
    label: 'Max Drawdown',
    whatItIs: 'The biggest drop from a peak value to the lowest point before recovery — the worst-case loss over a period.',
    whatItDoes: 'Tells you the most painful loss an investor would have felt if they bought at the peak and held through the bottom.',
    howItsUsed: 'Shown in the risk summary to give a gut-check on the worst historical loss the portfolio experienced.',
  },
  drawdown: {
    label: 'Drawdown',
    whatItIs: 'How far the portfolio is currently below its highest-ever value — like a water level below its highest mark.',
    whatItDoes: 'Shows whether the portfolio is in a dip right now and how deep that dip is.',
    howItsUsed: 'Plotted as a shaded area chart on the Risk page so you can see all the dips over time.',
  },
  var: {
    label: 'VaR (Value at Risk)',
    whatItIs: 'An estimate of the most you could expect to lose on a bad day — not the absolute worst, but a likely bad scenario.',
    whatItDoes: 'Gives a single number for "on a typical bad day, this portfolio could lose about X%", helping set expectations.',
    howItsUsed: 'Displayed in the risk metrics panel as a way to put a dollar or percentage figure on potential daily losses.',
  },
  cvar: {
    label: 'CVaR (Conditional Value at Risk)',
    whatItIs: 'The average loss you\'d expect on the very worst days — what happens if you go beyond a bad day into a terrible one.',
    whatItDoes: 'Extends VaR by answering "if things do go really wrong, how bad will it actually be on average?"',
    howItsUsed: 'Shown alongside VaR in the risk metrics panel to give a fuller picture of tail risk.',
  },
  beta: {
    label: 'Beta',
    whatItIs: 'A measure of how much a portfolio moves relative to the overall market — 1.0 means it moves in lock-step.',
    whatItDoes: 'A beta above 1 means it swings more than the market; below 1 means it\'s calmer. Negative beta means it moves opposite.',
    howItsUsed: 'Shown on the Risk page so you can judge how sensitive the portfolio is to broad market moves.',
  },
  trackingError: {
    label: 'Tracking Error',
    whatItIs: 'How much the portfolio\'s returns differ from its benchmark\'s returns, on average.',
    whatItDoes: 'A low tracking error means the portfolio closely mirrors the benchmark; a high one means it\'s taking independent bets.',
    howItsUsed: 'Displayed on the Risk page to show how closely the portfolio follows its benchmark strategy.',
  },
  informationRatio: {
    label: 'Information Ratio',
    whatItIs: 'A score that measures how consistently a portfolio beats its benchmark — like a batting average for portfolio managers.',
    whatItDoes: 'Combines excess return and consistency: a manager who beats the benchmark a little every year scores better than one who wins big once then loses.',
    howItsUsed: 'Shown on the Risk page to judge whether outperformance versus the benchmark is reliable or just luck.',
  },
  riskFreeRate: {
    label: 'Risk-Free Rate',
    whatItIs: 'The return you\'d earn from the safest possible investment — like a government savings account or Treasury bill.',
    whatItDoes: 'Acts as a baseline: any investment should at least beat this rate, otherwise why take the risk at all?',
    howItsUsed: 'Used behind the scenes to calculate the Sharpe Ratio by subtracting it from the portfolio\'s return.',
  },
  riskAssessment: {
    label: 'Risk Assessment',
    whatItIs: 'An overall judgment of how risky a portfolio is, usually summarized as Low, Moderate, or High.',
    whatItDoes: 'Gives a quick, human-readable verdict on risk level so you don\'t have to decode individual numbers.',
    howItsUsed: 'Shown as a badge on portfolio cards and the Risk page, derived from a combination of risk metrics.',
  },
  concentration: {
    label: 'Concentration',
    whatItIs: 'How much of the portfolio is clustered in a small number of holdings or sectors.',
    whatItDoes: 'High concentration means a few positions dominate — big wins are possible, but so are big losses.',
    howItsUsed: 'Highlighted on the Risk page to warn when too much of the portfolio depends on just a few bets.',
  },

  // Attribution
  attribution: {
    label: 'Attribution',
    whatItIs: 'The process of figuring out which holdings or sectors caused the portfolio\'s return to be what it was.',
    whatItDoes: 'Breaks the total return into pieces so you can see exactly where gains and losses came from.',
    howItsUsed: 'Shown on the Attribution page with charts that divide performance by sector and by individual security.',
  },
  contributor: {
    label: 'Contributor',
    whatItIs: 'A holding or sector that had a noticeable positive or negative effect on the portfolio\'s total return.',
    whatItDoes: 'Identifies which investments were the heroes or the culprits behind the period\'s performance.',
    howItsUsed: 'Listed in the top and bottom contributors tables to spotlight the biggest winners and losers.',
  },
  sectorAttribution: {
    label: 'Sector Attribution',
    whatItIs: 'The portion of the portfolio\'s return that came from being over- or under-invested in different industries.',
    whatItDoes: 'Tells you whether the portfolio\'s industry bets — like owning more tech than the benchmark — helped or hurt returns.',
    howItsUsed: 'Shown as a bar chart on the Attribution page, breaking performance down by industry group.',
  },
  securityAttribution: {
    label: 'Security Attribution',
    whatItIs: 'The portion of the portfolio\'s return that came from picking specific stocks or bonds, rather than industry choices.',
    whatItDoes: 'Isolates manager skill at the individual stock level — did picking the right companies within each sector add value?',
    howItsUsed: 'Shown alongside sector attribution on the Attribution page to separate industry bets from individual stock picks.',
  },
  topContributor: {
    label: 'Top Contributor',
    whatItIs: 'The holding or sector that added the most to the portfolio\'s return during the selected period.',
    whatItDoes: 'Quickly shows which investment deserves credit for driving performance higher.',
    howItsUsed: 'Displayed in the top contributors table, ranked by how much they boosted the portfolio\'s total return.',
  },
  bottomContributor: {
    label: 'Bottom Contributor',
    whatItIs: 'The holding or sector that dragged down the portfolio\'s return the most during the selected period.',
    whatItDoes: 'Quickly shows which investment hurt performance the most and deserves scrutiny.',
    howItsUsed: 'Displayed in the bottom contributors table, ranked by how much they reduced the portfolio\'s total return.',
  },

  // Periods
  period: {
    label: 'Period',
    whatItIs: 'The time range used for calculating and displaying performance or risk numbers.',
    whatItDoes: 'Lets you zoom in (like last month) or zoom out (like since the start) to understand performance at different scales.',
    howItsUsed: 'Selected via the period picker at the top of charts and tables to control which timeframe is shown.',
  },
  ytd: {
    label: 'YTD (Year to Date)',
    whatItIs: 'Performance from January 1st of this year up to today.',
    whatItDoes: 'Shows how the portfolio has done so far this calendar year, resetting every January.',
    howItsUsed: 'One of the period options in the dashboard so you can see the current year\'s progress.',
  },
  sinceInception: {
    label: 'Since Inception',
    whatItIs: 'Performance measured from the very first day the portfolio launched up to today.',
    whatItDoes: 'Gives the fullest possible picture of the portfolio\'s entire history in one number.',
    howItsUsed: 'Available as a period option to see the complete long-term track record of a portfolio.',
  },
  oneMonth: {
    label: '1 Month',
    whatItIs: 'Performance over the most recent 30 days.',
    whatItDoes: 'Captures very recent short-term momentum — helpful for seeing how markets have moved lately.',
    howItsUsed: 'One of the quick-select period options on performance charts and summary tables.',
  },
  threeMonth: {
    label: '3 Months',
    whatItIs: 'Performance over the most recent 90 days — roughly one business quarter.',
    whatItDoes: 'Gives a slightly longer short-term view than one month, smoothing out some of the daily noise.',
    howItsUsed: 'Available as a period picker option for a quarterly snapshot of performance.',
  },
  sixMonth: {
    label: '6 Months',
    whatItIs: 'Performance over the most recent 180 days — half a year.',
    whatItDoes: 'Bridges the gap between short-term and full-year views, useful for spotting medium-term trends.',
    howItsUsed: 'Available as a period picker option to see half-year performance and risk numbers.',
  },
  oneYear: {
    label: '1 Year',
    whatItIs: 'Performance over the most recent 12 months.',
    whatItDoes: 'Provides a full annual cycle of data, capturing seasonal patterns and a range of market conditions.',
    howItsUsed: 'One of the most-used period options, shown on the performance and risk pages.',
  },

  // Strategies & Benchmarks
  growthEquity: {
    label: 'Growth Equity',
    whatItIs: 'An investment strategy focused on owning stocks of companies expected to grow faster than average.',
    whatItDoes: 'Aims for high long-term returns by betting on fast-growing companies, accepting more short-term ups and downs.',
    howItsUsed: 'One of the portfolio strategies in this dashboard — its holdings lean toward technology and high-growth sectors.',
  },
  balancedIncome: {
    label: 'Balanced Income',
    whatItIs: 'A strategy that mixes stocks and bonds to balance growth potential with stability and regular income.',
    whatItDoes: 'Aims for smoother, more predictable returns by not putting all eggs in the growth basket.',
    howItsUsed: 'One of the portfolio strategies in this dashboard — it holds a mix of dividend stocks and bonds.',
  },
  canadianDividend: {
    label: 'Canadian Dividend',
    whatItIs: 'A strategy focused on Canadian companies that regularly pay dividends — cash payments to shareholders.',
    whatItDoes: 'Generates regular income from dividends while aiming for modest growth, popular with income-seeking investors.',
    howItsUsed: 'One of the portfolio strategies in this dashboard — its holdings are Canadian dividend-paying stocks.',
  },
  globalMacro: {
    label: 'Global Macro',
    whatItIs: 'A strategy that invests across countries and asset types based on big-picture economic trends worldwide.',
    whatItDoes: 'Tries to profit from major economic shifts — like currency moves, interest rate changes, or country-specific growth.',
    howItsUsed: 'One of the portfolio strategies in this dashboard — it holds a diverse mix of global assets.',
  },
  sp500: {
    label: 'S&P 500',
    whatItIs: 'An index tracking the 500 largest US companies by value — often used as the go-to measure of "the stock market".',
    whatItDoes: 'Serves as the main benchmark for US equity portfolios, showing what a broad US market exposure would have returned.',
    howItsUsed: 'Used as the benchmark for the Growth Equity portfolio to measure whether it\'s beating the US market.',
  },
  sptsx: {
    label: 'S&P/TSX Composite',
    whatItIs: 'An index tracking the largest companies listed on the Toronto Stock Exchange — the main Canadian market index.',
    whatItDoes: 'Serves as the benchmark for Canadian equity portfolios, representing what owning "all of Canada\'s top stocks" would return.',
    howItsUsed: 'Used as the benchmark for Canadian-focused portfolios in this dashboard.',
  },
  ftseCanadaBond: {
    label: 'FTSE Canada Bond Index',
    whatItIs: 'An index tracking the overall performance of Canadian government and corporate bonds.',
    whatItDoes: 'Serves as the benchmark for bond-heavy or balanced portfolios, showing what a broad Canadian bond exposure would return.',
    howItsUsed: 'Used as the benchmark for the Balanced Income portfolio to judge its fixed-income performance.',
  },
  msciWorld: {
    label: 'MSCI World',
    whatItIs: 'An index tracking large and mid-sized companies across 23 developed countries worldwide.',
    whatItDoes: 'Serves as the benchmark for global portfolios, representing what broad international market exposure would return.',
    howItsUsed: 'Used as the benchmark for the Global Macro portfolio to measure performance against a worldwide standard.',
  },

  // UI
  portfolioHealth: {
    label: 'Portfolio Health',
    whatItIs: 'A summary score or label that grades the overall condition of a portfolio across performance, risk, and diversification.',
    whatItDoes: 'Gives a quick, at-a-glance verdict — like a health checkup — without needing to read every individual metric.',
    howItsUsed: 'Shown as a badge or indicator on portfolio cards and the dashboard overview.',
  },
  csvExport: {
    label: 'CSV Export',
    whatItIs: 'A feature that downloads the data shown in a table as a spreadsheet file you can open in Excel or Google Sheets.',
    whatItDoes: 'Lets you take the data out of the dashboard for your own analysis, reporting, or record-keeping.',
    howItsUsed: 'Available via the Export button on data tables throughout the dashboard.',
  },
  holdingsEditor: {
    label: 'Add Holding',
    whatItIs: 'The action of adding a stock, bond, or other security to a portfolio by entering its ticker symbol and the number of shares you own.',
    whatItDoes: 'Expands the portfolio\'s record so the dashboard can track that position\'s value, weight, and contribution to performance.',
    howItsUsed: 'Click "Add Holding" on the Holdings page to open a form where you enter a ticker, quantity, and optional cost basis.',
  },
  livePrices: {
    label: 'Live Prices',
    whatItIs: 'Market prices pulled from Yahoo Finance that reflect the most recent trading day\'s closing value for each security.',
    whatItDoes: 'Keeps every holding\'s market value, weight, and return figures current without any manual updates.',
    howItsUsed: 'Automatically applied to all holdings calculations so the numbers you see are always based on the latest available price.',
  },
  dailyRefresh: {
    label: 'Daily Refresh',
    whatItIs: 'A once-a-day background process that fetches the latest prices and recalculates all portfolio metrics.',
    whatItDoes: 'Ensures the dashboard is always showing up-to-date data by the time you open it each morning, without needing to manually trigger anything.',
    howItsUsed: 'Runs automatically in the background — the "as-of date" shown on charts and tables tells you when the last refresh completed.',
  },
} satisfies Record<string, GlossaryEntry>;

export type TermKey = keyof typeof glossary;
