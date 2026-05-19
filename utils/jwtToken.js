import jwt from "jsonwebtoken";

export function signToken(userId) {
    const secret = process.env.JWT_SECRET_KEY?.trim();
    const expiresIn = process.env.JWT_EXPIRES_IN?.trim() || "7d";
    return jwt.sign({ id: userId }, secret, { expiresIn });
}
