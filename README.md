# Codelsoft USERS Microservices
Este repositorio contiene el codigo fuente para el servicio de autenticacion del sistema, a continuacion se encuentran los pasos para la instalacion de este.


## Pre-requisitos
- [Node.js](https://nodejs.org/es/) (version 22.14.0)

## Credenciales de pruebas
Para probar el sistema se tienen credenciales de administrador y de usuario, estas son: 
```bash
email: admin@admin.com
password: admin
```
```bash
email: user@user.com
password: user
```
## Instalación y configuración

1. **Clonar el repositorio**
```bash
git clone https://github.com/Codelsoft-Microservices/codelsoft-users.git
```

2. **Ingresar al directorio del proyecto**
```bash
cd codelsoft-users
```

3. **Instalar las dependencias**
```bash
npm install
```

4. **Crear un archivo `.env` en la raíz del proyecto y ingresar las variables de entorno**
```bash
cp .env.example .env
```

5. **Instalación de Imagenes de docker**
```bash
docker compose up -d
```

Se debe asegurar de haber instalado las imagenes de Docker y ademas de haber creado correctamente su .env

## Ejecutar la aplicación
```bash
npm run start
```
El servidor se iniciará en el puerto **3000** (o en el puerto definido en la variable de entorno `PORT`). Accede a la API mediante `http://localhost:3000`.

## Ejecutar la aplicación en entorno de desarrollo
```bash
npm run dev
```
Si se deseara se puede levantar el servidor en entorno de desarrollo, el servidor estara en el mismo puerto definido en la variable de entorno `PORT` en forma de desarrollo usando Nodemon.

## Seeding de la base de datos
```bash
npm run seed
```
Este comando genera 102 usuarios, donde corresponden a un usuario de pruebas y un administrador de pruebas.

## Autores
- [@Katerinu](https://www.github.com/Katerinu)
- [@AleUCN](https://github.com/AleUCN)
