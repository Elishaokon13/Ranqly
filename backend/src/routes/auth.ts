import { Router, Response } from "express";
import { z } from "zod";
import jwt from "jsonwebtoken";
import { SiweMessage } from "siwe";
import { verifyMessage as ethersVerifyMessage } from "ethers";
import { createPublicClient, http, type Hex } from "viem";
import {
  arbitrum,
  avalanche,
  base,
  baseSepolia,
  bsc,
  mainnet,
  optimism,
  polygon,
  sepolia,
  type Chain,
} from "viem/chains";
import { verifySiweMessage } from "viem/siwe";
import { prisma } from "../lib/prisma";
import { RequestWithAuth, requireAuth } from "../middleware/auth";

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-change-in-production";
const JWT_EXPIRY = "7d";

const CHAINS_BY_ID: Record<number, Chain> = {
  1: mainnet,
  8453: base,
  42161: arbitrum,
  10: optimism,
  137: polygon,
  11155111: sepolia,
  84532: baseSepolia,
  43114: avalanche,
  56: bsc,
};

const router = Router();

router.get("/nonce", async (_req, res: Response) => {
  res.json({ nonce: `ranqly${Date.now()}${Math.random().toString(36).slice(2, 12)}` });
});

router.post("/nonce", async (_req, res: Response) => {
  res.json({ nonce: `ranqly${Date.now()}${Math.random().toString(36).slice(2, 12)}` });
});

const siweBody = z.object({
  message: z.string(),
  signature: z.string(),
});

function normalizeSignature(sig: string): string {
  const s = (sig ?? "").trim();
  if (/^0x[0-9a-fA-F]+$/.test(s)) return s;
  if (/^[0-9a-fA-F]+$/.test(s)) return `0x${s}`;
  return s;
}

/** Hex payload byte length (0x-prefixed or not). */
function signatureByteLength(hexSig: string): number {
  const s = hexSig.trim();
  const h = s.startsWith("0x") ? s.slice(2) : s;
  if (!/^[0-9a-fA-F]*$/i.test(h) || h.length % 2 !== 0) return 0;
  return h.length / 2;
}

/**
 * Only these shapes are safe for siwe + ethers ECDSA paths.
 * Smart accounts / ERC-6492 / AA wallets send much longer payloads — never pass those to ethers.
 */
function isProbableEoaSecp256k1Signature(hexSig: string): boolean {
  const n = signatureByteLength(hexSig);
  return n === 65 || n === 64;
}

async function verifyWithViem(params: {
  message: string;
  signature: Hex;
  address: string;
  domain: string;
  nonce: string;
  chainId: number;
}): Promise<boolean> {
  const chain = CHAINS_BY_ID[params.chainId] ?? mainnet;
  const envRpc = process.env[`SIWE_RPC_${params.chainId}`] ?? process.env.SIWE_RPC_URL;
  try {
    const client = createPublicClient({
      chain,
      transport: envRpc ? http(envRpc) : http(),
    });
    return await verifySiweMessage(client, {
      address: params.address as Hex,
      message: params.message,
      signature: params.signature,
      domain: params.domain,
      nonce: params.nonce,
    });
  } catch (e) {
    console.error("[SIWE] viem verifySiweMessage failed:", e);
    return false;
  }
}

router.post("/siwe", async (req, res: Response) => {
  const parsed = siweBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body", details: parsed.error.flatten() });
    return;
  }
  let { message, signature } = parsed.data;
  message = (message ?? "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const normalizedSignature = normalizeSignature(signature) as Hex;

  let siweMessage: SiweMessage;
  try {
    siweMessage = new SiweMessage(message);
  } catch (e) {
    res.status(400).json({ error: "Invalid SIWE message", details: String(e) });
    return;
  }

  const addr = (siweMessage.address ?? "").toLowerCase();
  const chainId = Number(siweMessage.chainId);
  if (!addr || !/^0x[a-f0-9]{40}$/.test(addr)) {
    res.status(400).json({ error: "Invalid address in message" });
    return;
  }

  const domain = siweMessage.domain ?? "";
  const nonce = siweMessage.nonce ?? "";
  let walletAddress: string | undefined;
  let outChainId: number = chainId;

  const eoaShape = isProbableEoaSecp256k1Signature(normalizedSignature);

  if (!eoaShape) {
    const ok = await verifyWithViem({
      message,
      signature: normalizedSignature,
      address: addr,
      domain,
      nonce,
      chainId,
    });
    if (!ok) {
      res.status(401).json({
        error: "Invalid signature",
        details: "SMART_ACCOUNT_VERIFY_FAILED",
        hint:
          "Smart / contract wallets need a working HTTP RPC. Set SIWE_RPC_URL or SIWE_RPC_<chainId> in .env (e.g. Alchemy/Infura for that chain).",
      });
      return;
    }
    walletAddress = addr;
  } else {
    try {
      const result = await siweMessage.verify({ signature: normalizedSignature }, { suppressExceptions: true });
      if (result.success) {
        walletAddress = (result.data.address ?? "").toLowerCase();
        outChainId = result.data.chainId ?? chainId;
      }
    } catch (e) {
      console.error("[SIWE] siwe.verify threw:", e);
    }

    if (!walletAddress) {
      try {
        const recovered = ethersVerifyMessage(message, normalizedSignature);
        if (recovered?.toLowerCase() === addr) {
          walletAddress = addr;
        }
      } catch {
        /* fall through */
      }
    }

    if (!walletAddress) {
      const ok = await verifyWithViem({
        message,
        signature: normalizedSignature,
        address: addr,
        domain,
        nonce,
        chainId,
      });
      if (ok) walletAddress = addr;
    }

    if (!walletAddress) {
      res.status(401).json({ error: "Invalid signature", details: "VERIFY_FAILED" });
      return;
    }
  }

  let user = await prisma.user.findUnique({ where: { walletAddress } });
  if (!user) {
    user = await prisma.user.create({
      data: { walletAddress },
    });
  }
  const token = jwt.sign(
    { userId: user.id, walletAddress: user.walletAddress ?? undefined },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  );
  res.json({
    token,
    address: walletAddress,
    chainId: outChainId,
    user: {
      id: user.id,
      walletAddress: user.walletAddress,
      email: user.email,
      path: user.path,
      name: user.name,
      avatarUrl: user.avatarUrl,
    },
  });
});

router.get("/me", requireAuth, async (req: RequestWithAuth, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId! },
    select: {
      id: true,
      walletAddress: true,
      email: true,
      path: true,
      name: true,
      avatarUrl: true,
      organizerVerified: true,
    },
  });
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(user);
});

export default router;
