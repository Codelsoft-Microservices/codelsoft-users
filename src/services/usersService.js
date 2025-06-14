import { status } from "@grpc/grpc-js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";
import { getCollection, createDocument, getDocument, updateDocument} from "../utils/mongoORM.js";
import bcrypt from "bcryptjs";
import dayjs from "dayjs";
import { v4 as uuidv4 } from "uuid";
import { generateTokenJWT, verifyTokenJWT } from "../utils/tokenGenerator.js";

// Funciones del microservicio de usuarios
const GetAllUsers = catchAsync(async (call, callback) => {
    const token = call.metadata.get("authorization")[0];
    const decodedToken = verifyTokenJWT(token);
    if (!decodedToken) {
        return callback(new AppError("Token inválido o expirado", status.UNAUTHENTICATED));
    }
    if (decodedToken.role !== "Administrador") {
        return callback(new AppError("No tienes permiso para acceder a este recurso", status.PERMISSION_DENIED));
    }
    const usersCollection = await getCollection("USERS");
    const usersArray = []
    for (const users in usersCollection) {
        if (usersCollection[users].isActive) {
            usersArray.push(usersCollection[users]);
        }
    }
    if (!usersArray || usersArray.length === 0) {
        return callback(new AppError("No se encontraron usuarios activos", status.NOT_FOUND));
    }
    const adaptedUsers = usersArray.map(user => ({
        uuid: user.uuid,
        name: user.name,
        lastname: user.lastname,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
    }));
    return callback(null, { users: adaptedUsers });
})

const GetUserByUUID = catchAsync(async (call, callback) => {
    const { uuid } = call.request;
    const token = call.metadata.get("authorization")[0];
    const decodedToken = verifyTokenJWT(token);

    if (!decodedToken) {
        return next(new AppError("Token inválido o expirado", status.UNAUTHENTICATED));
    }
    if (decodedToken.role !== "Administrador") {
        if( decodedToken.uuid === uuid) {
            console.log("Usuario no es administrador, pero está solicitando su propio usuario");
        }
        else {
            return next(new AppError("No tienes permiso para acceder a este recurso", status.PERMISSION_DENIED));
        }
    }

    if (!uuid) {
        return next(new AppError("El uuid es requerido", status.INVALID_ARGUMENT));
    }

    const user = await getDocument("USERS", { uuid: uuid });

    if (!user || !user.isActive) {
        return next(new AppError("Usuario no encontrado", 404));
    }
    
    const adaptedUser = {
        uuid: user.uuid,
        name: user.name,
        lastname: user.lastname,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
    };

    return callback(null, { user: adaptedUser });
});

const CreateUser = catchAsync(async (call, callback) => {
   const { name, lastname, email, password, passwordConfirm, role} = call.request;
    if (!name || !lastname || !email || !password || !passwordConfirm, !role) {
        return next(new AppError("Todos los campos son obligatorios", 400));
    }

    if (password !== passwordConfirm) {
        return callback(new AppError("Las contraseñas no coinciden", status.INVALID_ARGUMENT));
    }

    // Verificar si el usuario ya existe
    const existingUser = await getDocument("USERS", { email: email });
    if (existingUser) {
        return callback(new AppError("El usuario ya existe", status.ALREADY_EXISTS));
    }
    if( role !== "Administrador" || role !== "Cliente") {
        return callback(new AppError("Rol inválido", status.INVALID_ARGUMENT));
    }
    if(role === "Administrador") {
        // Verificar que exista un token de usuario con rol de administrador para crear otro administrador
        const token = call.metadata.get("authorization")[0];
        const decodedToken = verifyTokenJWT(token);

        if (!decodedToken || decodedToken.role !== "Administrador") {
            return callback(new AppError("No tienes permiso para crear un administrador", status.PERMISSION_DENIED));
        }
    }

    // Hashear la contraseña antes de guardarla
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    // Crear el nuevo usuario
    const newUser = {
        name: name,
        lastname: lastname,
        email: email,
        password: hashedPassword,
        role: role,
        isActive: true,
        createdAt: dayjs().format("YYYY-MM-DD HH:mm:ss"),
        updatedAt: dayjs().format("YYYY-MM-DD HH:mm:ss"),
        uuid: uuidv4(),
    };

    const createdUser = await createDocument("USERS", newUser);
    
if (!createdUser) {
    return callback(new AppError("Error al crear el usuario", status.INTERNAL));
}
    // Generar un token JWT para el nuevo usuario
    const userForToken = {
        uuid: createdUser.uuid,
        name: createdUser.name,
        lastname: createdUser.lastname,
        email: createdUser.email,
        role: createdUser.role,
        createdAt: createdUser.createdAt,
    };
    const generatedToken = generateTokenJWT(userForToken);
    return callback(null, {user: createdUser, token: generatedToken });
});

const UpdateUser = catchAsync(async (call, callback) => {
    const { uuid, name, lastname, email } = call.request;
    if (!uuid || !name || !lastname || !email) {
        return callback(new AppError("Todos los campos son obligatorios", status.INVALID_ARGUMENT));
    }

    // Verificar si el token es válido
    const token = call.metadata.get("authorization")[0];
    const decodedToken = verifyTokenJWT(token);
    if (!decodedToken) {
        return callback(new AppError("No se a iniciado sesion o el token es invalido", status.UNAUTHENTICATED));
    }
    if(decodedToken.role !== "Administrador") {
        if(decodedToken.uuid === uuid) {
            console.log("Usuario no es administrador, pero está actualizando su propio usuario");
        } else {
            return callback(new AppError("No tienes permiso para actualizar este usuario", status.PERMISSION_DENIED));
        }
    }

    //si se intenta modificar la password el sistema debe devolver un error
    if (call.request.password || call.request.passwordConfirm) {
        return callback(new AppError("No puedes modificar la contraseña de un usuario con este método", status.INVALID_ARGUMENT));
    }


    // Verificar si el usuario existe
    const existingUser = await getDocument("USERS", { uuid: uuid });
    if (!existingUser) {
        return callback(new AppError("Usuario no encontrado", status.NOT_FOUND));
    }
    // Actualizar los campos del usuario
    const updatedUser = {
        ...existingUser,
        name: name,
        lastname: lastname,
        email: email,
        updatedAt: dayjs().format("YYYY-MM-DD HH:mm:ss"),
    };
    const result = await updateDocument("USERS", { uuid: uuid }, updatedUser);
    if (!result) {
        return callback(new AppError("Error al actualizar el usuario", status.INTERNAL));
    }
    // Generar un token JWT para el usuario actualizado
    const userForToken = {
        uuid: updatedUser.uuid,
        name: updatedUser.name,
        lastname: updatedUser.lastname,
        email: updatedUser.email,
        role: updatedUser.role,
        createdAt: updatedUser.createdAt,
    };
    const generatedToken = generateTokenJWT(userForToken);
    return callback(null, { user: userForToken, token: generatedToken });
}
);

const DeleteUser = catchAsync(async (call, callback) => {
    const { uuid } = call.request;
    if (!uuid) {
        return callback(new AppError("El uuid es requerido", status.INVALID_ARGUMENT));
    }

    // Verificar si el token es válido
    const token = call.metadata.get("authorization")[0];
    const decodedToken = verifyTokenJWT(token);
    if (!decodedToken || decodedToken.role !== "Administrador") {
        return callback(new AppError("No tienes permiso para eliminar usuarios", status.PERMISSION_DENIED));
    }

    // Verificar si el usuario existe
    const existingUser = await getDocument("USERS", { uuid: uuid });
    if (!existingUser) {
        return callback(new AppError("Usuario no encontrado", status.NOT_FOUND));
    }

    // Marcar al usuario como inactivo en lugar de eliminarlo
    existingUser.isActive = false;
    existingUser.updatedAt = dayjs().format("YYYY-MM-DD HH:mm:ss");
    
    const result = await updateDocument("USERS", { uuid: uuid }, existingUser);
    if (!result) {
        return callback(new AppError("Error al eliminar el usuario", status.INTERNAL));
    }

    return callback(null);
}
);


export default {
    GetAllUsers,
    GetUserByUUID,
    CreateUser,
    UpdateUser,
    DeleteUser
};