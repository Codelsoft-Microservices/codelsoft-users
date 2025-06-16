import {connectDB, createDocument, getCollection} from '../../utils/mongoORM.js';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const seedUsersMock = async () => {
    await connectDB();
    const filePath = path.join(__dirname, '../mock/mockUsers.json');
    const data = fs.readFileSync(filePath, 'utf-8');
    const usersMock = JSON.parse(data);

    const usersCollection = await getCollection('USERS');

    if( usersCollection.length > 0) {
        console.log('La colección USERS ya tiene datos, no se realizará la siembra.');
        return false;
    }

    for (const user of usersMock) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(user.password, salt);
        const newUser = {
            uuid: user.uuid,
            name: user.name,
            lastname: user.lastname,
            email: user.email,
            password: hashedPassword,
            role: user.role,
            isActive: user.isActive,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        await createDocument(newUser, 'USERS');
    }

    console.log('Datos de usuarios sembrados correctamente.');
    return true;
}

export { seedUsersMock };