"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const siwe_1 = require("siwe");
const ethers_1 = require("ethers");
const viem_1 = require("viem");
const chains_1 = require("viem/chains");
const siwe_2 = require("viem/siwe");
const prisma_1 = require("../lib/prisma");
const auth_1 = require("../middleware/auth");
const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-change-in-production";
const JWT_EXPIRY = "7d";
const CHAINS_BY_ID = {
    1: chains_1.mainnet,
    8453: chains_1.base,
    42161: chains_1.arbitrum,
    10: chains_1.optimism,
    137: chains_1.polygon,
    11155111: chains_1.sepolia,
    84532: chains_1.baseSepolia,
    43114: chains_1.avalanche,
    56: chains_1.bsc,
};
const router = (0, express_1.Router)();
router.get("/nonce", async (_req, res) => {
    res.json({ nonce: `ranqly${Date.now()}${Math.random().toString(36).slice(2, 12)}` });
});
router.post("/nonce", async (_req, res) => {
    res.json({ nonce: `ranqly${Date.now()}${Math.random().toString(36).slice(2, 12)}` });
});
const siweBody = zod_1.z.object({
    message: zod_1.z.string(),
    signature: zod_1.z.string(),
});
function normalizeSignature(sig) {
    const s = (sig ?? "").trim();
    if (/^0x[0-9a-fA-F]+$/.test(s))
        return s;
    if (/^[0-9a-fA-F]+$/.test(s))
        return `0x${s}`;
    return s;
}
/** Hex payload byte length (0x-prefixed or not). */
function signatureByteLength(hexSig) {
    const s = hexSig.trim();
    const h = s.startsWith("0x") ? s.slice(2) : s;
    if (!/^[0-9a-fA-F]*$/i.test(h) || h.length % 2 !== 0)
        return 0;
    return h.length / 2;
}
/**
 * Only these shapes are safe for siwe + ethers ECDSA paths.
 * Smart accounts / ERC-6492 / AA wallets send much longer payloads — never pass those to ethers.
 */
function isProbableEoaSecp256k1Signature(hexSig) {
    const n = signatureByteLength(hexSig);
    return n === 65 || n === 64;
}
async function verifyWithViem(params) {
    const chain = CHAINS_BY_ID[params.chainId] ?? chains_1.mainnet;
    const envRpc = process.env[`SIWE_RPC_${params.chainId}`] ?? process.env.SIWE_RPC_URL;
    try {
        const client = (0, viem_1.createPublicClient)({
            chain,
            transport: envRpc ? (0, viem_1.http)(envRpc) : (0, viem_1.http)(),
        });
        return await (0, siwe_2.verifySiweMessage)(client, {
            address: params.address,
            message: params.message,
            signature: params.signature,
            domain: params.domain,
            nonce: params.nonce,
        });
    }
    catch (e) {
        console.error("[SIWE] viem verifySiweMessage failed:", e);
        return false;
    }
}
router.post("/siwe", async (req, res) => {
    const parsed = siweBody.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: "Invalid body", details: parsed.error.flatten() });
        return;
    }
    let { message, signature } = parsed.data;
    message = (message ?? "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    const normalizedSignature = normalizeSignature(signature);
    let siweMessage;
    try {
        siweMessage = new siwe_1.SiweMessage(message);
    }
    catch (e) {
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
    let walletAddress;
    let outChainId = chainId;
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
                hint: "Smart / contract wallets need a working HTTP RPC. Set SIWE_RPC_URL or SIWE_RPC_<chainId> in .env (e.g. Alchemy/Infura for that chain).",
            });
            return;
        }
        walletAddress = addr;
    }
    else {
        try {
            const result = await siweMessage.verify({ signature: normalizedSignature }, { suppressExceptions: true });
            if (result.success) {
                walletAddress = (result.data.address ?? "").toLowerCase();
                outChainId = result.data.chainId ?? chainId;
            }
        }
        catch (e) {
            console.error("[SIWE] siwe.verify threw:", e);
        }
        if (!walletAddress) {
            try {
                const recovered = (0, ethers_1.verifyMessage)(message, normalizedSignature);
                if (recovered?.toLowerCase() === addr) {
                    walletAddress = addr;
                }
            }
            catch {
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
            if (ok)
                walletAddress = addr;
        }
        if (!walletAddress) {
            res.status(401).json({ error: "Invalid signature", details: "VERIFY_FAILED" });
            return;
        }
    }
    let user = await prisma_1.prisma.user.findUnique({ where: { walletAddress } });
    if (!user) {
        user = await prisma_1.prisma.user.create({
            data: { walletAddress },
        });
    }
    const token = jsonwebtoken_1.default.sign({ userId: user.id, walletAddress: user.walletAddress ?? undefined }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
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
router.get("/me", auth_1.requireAuth, async (req, res) => {
    const user = await prisma_1.prisma.user.findUnique({
        where: { id: req.userId },
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
exports.default = router;
