exports.categoryName = "Admin-Hypes";
exports.channels = [
  "hype-logs", // becomes hypeLogs in schema
  "missions-hall", // becomes missionsHall in schema
  "stadium", // becomes stadium in schema
  "hyper-market", // becomes hyperMarket in schema
  "hyper-notes", // becomes hyperNotes in schema
  "raffles",
];
exports.UserChannels = ["events", "shop", "my-bag", "auctions", "raffles"];



exports.walletRegexPatterns = [
  { value: "Ethereum", regex: /^0x[a-fA-F0-9]{40}$/ },
  { value: "Solana", regex: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/ },
  { value: "Bitcoin", regex: /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,39}$/ },
  { value: "Binance", regex: /^0x[a-fA-F0-9]{40}$/ }, // BEP-20 (same as Ethereum)
  { value: "Cardano", regex: /^addr1[ac-hj-np-z02-9]{58}$/ },
  { value: "Polygon", regex: /^0x[a-fA-F0-9]{40}$/ }, // Matic (same as Ethereum)
  { value: "Avalanche", regex: /^0x[a-fA-F0-9]{40}$|^X-[a-zA-Z0-9]{39}$/ }, // C-Chain or X-Chain
  { value: "Tron", regex: /^T[a-zA-Z0-9]{33}$/ },
  { value: "Polkadot", regex: /^[1-9A-HJ-NP-Za-km-z]{47,48}$/ }, // SS58 format
  { value: "Ripple", regex: /^r[0-9a-zA-Z]{24,34}$/ }
];
