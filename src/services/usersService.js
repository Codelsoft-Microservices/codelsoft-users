import { status } from "@grpc/grpc-js";
import catchAsync from "../utils/catchAsync.js";
import { getCollection, createDocument, getDocument, updateDocument} from "../utils/mongoORM.js";
import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";

const GetAllUsers = catchAsync(async (call, callback) => {

    const usersCollection = await getCollection("USERS");
    const usersArray = []
    for (const users in usersCollection) {
        if (usersCollection[users].isActive) {
            usersArray.push(usersCollection[users]);
        }
    }

    if (!usersArray || usersArray.length === 0) {
        return callback({
            code: status.NOT_FOUND,
            message: "No se encontraron usuarios activos",
        });
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

    if (!uuid) {
        return callback({
            code: status.INVALID_ARGUMENT,
            message: "El uuid es requerido",
        });
    }

    const user = await getDocument("USERS", { uuid: uuid });

    if (!user || !user.isActive) {
        return callback({
            code: status.NOT_FOUND,
            message: "Usuario no encontrado",
        });
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
   const {uuid, name, lastname, email, password, passwordConfirm, role} = call.request;

    if (password !== passwordConfirm) {
        return callback({
            code: status.INVALID_ARGUMENT,
            message: "Las contraseñas no coinciden",
        });
    }

    const existingUser = await getDocument("USERS", { email: email });

    if (existingUser) {
        return callback({
            code: status.ALREADY_EXISTS,
            message: "El usuario ya existe",
        });
    }

    if( role !== "Administrador" && role !== "Cliente") {
        return callback({
            code: status.INVALID_ARGUMENT,
            message: "Rol inválido",
        });
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
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        uuid: uuid,
    };

    const createdUser = await createDocument(newUser, "USERS");
    
    if (!createdUser) {
        return callback({
            code: status.INTERNAL,
            message: "Error al crear el usuario",
        });
    }
    const userResponse = {
        uuid: newUser.uuid,
        name: newUser.name,
        lastname: newUser.lastname,
        email: newUser.email,
        role: newUser.role,
        createdAt: newUser.createdAt,
    };
    return callback(null, {user: userResponse});
});

const UpdateUser = catchAsync(async (call, callback) => {
    const { uuid, name, lastname, email } = call.request;
    if (!uuid || !name || !lastname || !email) {
        return callback({
            code: status.INVALID_ARGUMENT,
            message: "Todos los campos son obligatorios",
        });
    }

    //si se intenta modificar la password el sistema debe devolver un error
    if (call.request.password || call.request.passwordConfirm) {
        return callback({
            code: status.INVALID_ARGUMENT,
            message: "No puedes modificar la contraseña de un usuario con este método",
        });
    }

    // Verificar si el usuario existe
    const existingUser = await getDocument("USERS", { uuid: uuid });
    if (!existingUser) {
        return callback({
            code: status.NOT_FOUND,
            message: "Usuario no encontrado",
        });
    }
    
    // Actualizar los campos del usuario
    const updatedUser = {
        ...existingUser,
        name: name,
        lastname: lastname,
        email: email,
        updatedAt: new Date().toISOString(),
    };

    const result = await updateDocument("USERS", { uuid: uuid }, updatedUser);

    if (!result) {
        return callback({
            code: status.INTERNAL,
            message: "Error al actualizar el usuario",
        });
    }

    const userResponse = {
        uuid: updatedUser.uuid,
        name: updatedUser.name,
        lastname: updatedUser.lastname,
        email: updatedUser.email,
        role: updatedUser.role,
        createdAt: updatedUser.createdAt,
    };
    return callback(null, { user: userResponse});
});

const DeleteUser = catchAsync(async (call, callback) => {
    const { uuid } = call.request;
    if (!uuid) {
        return callback({
            code: status.INVALID_ARGUMENT,
            message: "El uuid es requerido",
        });
    }

    // Verificar si el usuario existe
    const existingUser = await getDocument("USERS", { uuid: uuid });
    if (!existingUser) {
        return callback({
            code: status.NOT_FOUND,
            message: "Usuario no encontrado",
        });
    }

    // Marcar al usuario como inactivo en lugar de eliminarlo
    existingUser.isActive = false;
    existingUser.updatedAt = new Date().toISOString();
    
    const result = await updateDocument(existingUser, "USERS", { uuid: uuid }, );
    if (!result) {
        return callback({
            code: status.INTERNAL,
            message: "Error al eliminar el usuario",
        });
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