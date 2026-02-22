/**
 * Direct Solana ledger - records trades on-chain without a server.
 * DEMO ONLY: Keypair is hardcoded. Do not use in production.
 */

import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  TransactionInstruction,
  SystemProgram,
} from "@solana/web3.js";
import bs58 from "bs58";

const PROGRAM_ID = new PublicKey("dEHBSkV1rDmC4Uc5AL9CRNeaTaq8Lq44tbfYasWX2qF");
const RPC_URL = "https://api.devnet.solana.com";

// DEMO ONLY: Your devnet keypair (base58).
const LEDGER_KEYPAIR_BASE58 =
  "3wT4o6j5vuWKMD4eg4Bsz9ZgE7aKqbyB1dxEK19y63J4GTHpMW85r7NLE21n9PNgkqDqqdQY2JY6mYkMv3inpSsq";

// record_trade discriminator from IDL
const RECORD_TRADE_DISCRIMINATOR = new Uint8Array([83, 201, 2, 171, 223, 122, 186, 127]);

function u64Le(n: number): Uint8Array {
  const arr = new Uint8Array(8);
  new DataView(arr.buffer).setBigUint64(0, BigInt(n), true);
  return arr;
}

function getKeypair(): Keypair {
  return Keypair.fromSecretKey(bs58.decode(LEDGER_KEYPAIR_BASE58));
}

export async function recordTradeOnChain(
  marketId: number,
  side: "yes" | "no",
  amount: number
): Promise<boolean> {
  try {
    const keypair = getKeypair();
    const connection = new Connection(RPC_URL);
    const nonce = Date.now();
    const amountCents = Math.round(amount * 100);

    // PDA seeds must match Rust: b"trade", market_id, payer, nonce
    const [tradePda] = PublicKey.findProgramAddressSync(
      [
        new TextEncoder().encode("trade"),
        u64Le(marketId),
        keypair.publicKey.toBytes(),
        u64Le(nonce),
      ],
      PROGRAM_ID
    );

    // Borsh: discriminator + market_id(u64) + side(bool) + amount(u64) + nonce(u64)
    const data = new Uint8Array([
      ...RECORD_TRADE_DISCRIMINATOR,
      ...u64Le(marketId),
      side === "yes" ? 1 : 0,
      ...u64Le(amountCents),
      ...u64Le(nonce),
    ]);

    const ix = new TransactionInstruction({
      keys: [
        { pubkey: keypair.publicKey, isSigner: true, isWritable: true },
        { pubkey: tradePda, isSigner: false, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: PROGRAM_ID,
      data,
    });

    const tx = new Transaction().add(ix);
    const sig = await connection.sendTransaction(tx, [keypair], {
      skipPreflight: false,
      preflightCommitment: "confirmed",
    });
    await connection.confirmTransaction(sig, "confirmed");
    return true;
  } catch (err) {
    console.warn("[Ledger] record-trade error:", err);
    return false;
  }
}
