import dotenv from "dotenv";
import jwt from "jsonwebtoken";

dotenv.config();

export const generateTokenJWT = (date) => {
    // Convertir cualquier BigInt a String antes de firmar el token
    const dateToken = JSON.parse(JSON.stringify(date, (key, value) => {
        if (typeof value === 'bigint') {
            return value.toString(); // Convertir BigInt a String
        }
        return value;
    }));

    const token = jwt.sign(
        { date: dateToken },
        process.env.JWT_SECRET,
        {
            expiresIn: '60d',
            algorithm: process.env.ALG_TOKEN,
            issuer: 'CODELSOFT-USERS-API',
            audience: 'CODELSOFT-USERS-CLIENT',
            jwtid: 'JWT-001'
        }
    );
    return token;
}

export const verifyTokenJWT = (token) => {
    try {
        // Eliminar el prefijo 'Bearer ' si está presente
        if (token.startsWith("Bearer ")) {
            token = token.slice(7).trim();
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: [process.env.ALG_TOKEN] });
        return decoded;
    } catch (error) {
        console.error("Error al verificar el token:", error.message);
        return null; // Retornar null si el token no es válido
    }
};