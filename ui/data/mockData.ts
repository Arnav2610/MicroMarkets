export interface Market {
  id: string;
  question: string;
  yesOdds: number;
  noOdds: number;
  buyIn: number;
  poolSize: number;
  timeRemaining: string;
  createdBy: string;
  resolved: boolean;
  groupId: string;
}

export interface Group {
  id: string;
  name: string;
  memberCount: number;
}

export interface User {
  id: string;
  username: string;
  balance: number;
  avatar: string;
}

export const currentUser: User = {
  id: "user-1",
  username: "alex_chen",
  balance: 1000,
  avatar: "AC",
};

export const groups: Group[] = [
  { id: "group-1", name: "Roommates", memberCount: 4 },
  { id: "group-2", name: "Work Squad", memberCount: 8 },
  { id: "group-3", name: "College Friends", memberCount: 12 },
];

export const markets: Market[] = [
  {
    id: "market-1",
    question: "Will Sarah actually wake up before 9am tomorrow?",
    yesOdds: 35,
    noOdds: 65,
    buyIn: 10,
    poolSize: 120,
    timeRemaining: "12h left",
    createdBy: "mike_wang",
    resolved: false,
    groupId: "group-1",
  },
  {
    id: "market-2",
    question: "Does Jake finish the project before Friday?",
    yesOdds: 72,
    noOdds: 28,
    buyIn: 20,
    poolSize: 280,
    timeRemaining: "2d left",
    createdBy: "emma_lee",
    resolved: false,
    groupId: "group-1",
  },
  {
    id: "market-3",
    question: "Will it rain this weekend?",
    yesOdds: 48,
    noOdds: 52,
    buyIn: 5,
    poolSize: 85,
    timeRemaining: "4d left",
    createdBy: "alex_chen",
    resolved: false,
    groupId: "group-1",
  },
  {
    id: "market-4",
    question: "Does anyone order pizza tonight?",
    yesOdds: 88,
    noOdds: 12,
    buyIn: 10,
    poolSize: 150,
    timeRemaining: "8h left",
    createdBy: "sarah_kim",
    resolved: false,
    groupId: "group-1",
  },
  {
    id: "market-5",
    question: "Will the new feature ship this sprint?",
    yesOdds: 25,
    noOdds: 75,
    buyIn: 20,
    poolSize: 340,
    timeRemaining: "6d left",
    createdBy: "dev_one",
    resolved: false,
    groupId: "group-2",
  },
];

export const getMarketsByGroup = (groupId: string) => {
  return markets.filter((m) => m.groupId === groupId);
};

export const getGroupById = (groupId: string) => {
  return groups.find((g) => g.id === groupId);
};

export const getMarketById = (marketId: string) => {
  return markets.find((m) => m.id === marketId);
};
