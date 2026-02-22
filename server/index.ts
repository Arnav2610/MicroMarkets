/**
 * MicroMarkets Ledger Server
 * Submits trades to Solana for on-chain transparency.
 * Also provides shared state API for multi-device demo (groups, users, markets).
 *
 * Run: npx tsx index.ts
 * Env: SOLANA_KEYPAIR_PATH or SOLANA_KEYPAIR_BASE58, PORT (default 3001)
 */

import "dotenv/config";
import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import bs58 from "bs58";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import BN from "bn.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// --- Shared state for multi-device demo (in-memory) ---
interface PersistedState {
  users: Array<{ id: string; name: string; pubkey?: string }>;
  groups: Array<{
    id: string;
    name: string;
    joinCode: string;
    baseBuyIn: number;
    members: string[];
  }>;
  markets: unknown[];
  balanceCache: Record<string, number>;
  marketIdCounter: number;
}

let sharedState: PersistedState = {
  users: [],
  groups: [],
  markets: [],
  balanceCache: {},
  marketIdCounter: Math.floor(Date.now() / 1000),
};

const PROGRAM_ID = new PublicKey("dEHBSkV1rDmC4Uc5AL9CRNeaTaq8Lq44tbfYasWX2qF");
const RPC_URL = process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com";

function loadKeypair(): Keypair {
  const base58 = process.env.SOLANA_KEYPAIR_BASE58;
  if (base58) {
    return Keypair.fromSecretKey(bs58.decode(base58));
  }
  const keyPath = process.env.SOLANA_KEYPAIR_PATH || path.join(process.env.HOME || "", ".config/solana/id.json");
  const secret = JSON.parse(fs.readFileSync(keyPath, "utf-8"));
  return Keypair.fromSecretKey(Uint8Array.from(secret));
}

const app = express();
app.use(cors());
app.use(express.json());

app.post("/record-trade", async (req, res) => {
  try {
    const { marketId, side, amount } = req.body;
    if (typeof marketId !== "number" || typeof side !== "boolean" || typeof amount !== "number") {
      return res.status(400).json({ error: "Invalid body: marketId (number), side (boolean), amount (number)" });
    }

    const keypair = loadKeypair();
    const connection = new Connection(RPC_URL);

    const idlPath = path.join(__dirname, "..", "micromarkets-ledger", "target", "idl", "micromarkets_ledger.json");
    const idl = JSON.parse(fs.readFileSync(idlPath, "utf-8"));

    const provider = new anchor.AnchorProvider(connection, new anchor.Wallet(keypair), {
      commitment: "confirmed",
    });
    const program = new anchor.Program(idl, provider);

    const nonce = Date.now();
    const amountCents = Math.round(amount * 100);
    const bnMarketId = new BN(marketId);
    const bnNonce = new BN(nonce);

    // PDA seeds must match program: trade, market_id, payer, nonce (all u64 as LE bytes)
    const [tradePda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("trade"),
        bnMarketId.toArrayLike(Buffer, "le", 8),
        keypair.publicKey.toBuffer(),
        bnNonce.toArrayLike(Buffer, "le", 8),
      ],
      program.programId
    );

    await program.methods
      .recordTrade(bnMarketId, side, new BN(amountCents), bnNonce)
      .accountsPartial({
        payer: keypair.publicKey,
        trade: tradePda,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    res.json({ success: true });
  } catch (err: unknown) {
    console.error("record-trade error:", err);
    res.status(500).json({ error: err instanceof Error ? err.message : "Unknown error" });
  }
});

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

// --- Shared state API (multi-device demo) ---
app.get("/api/state", (_req, res) => {
  res.json(sharedState);
});

app.post("/api/state", (req, res) => {
  const body = req.body as PersistedState;
  if (
    body &&
    Array.isArray(body.users) &&
    Array.isArray(body.groups) &&
    Array.isArray(body.markets) &&
    typeof body.balanceCache === "object" &&
    typeof body.marketIdCounter === "number"
  ) {
    sharedState = body;
    res.json({ ok: true });
  } else {
    res.status(400).json({ error: "Invalid state payload" });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Ledger server on http://localhost:${PORT}`);
});
