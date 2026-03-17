# 🎓 Learning Management System (LMS)

A scalable and professional Learning Management System (LMS) built with modern technologies, designed to manage users, courses, roles, and permissions efficiently.

---

## 🚀 Tech Stack

- **Backend:** NestJS
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Authentication:** JWT (Passport)
- **Validation:** class-validator
- **Containerization:** Docker
- **Caching (optional):** NodeCache / Redis

---

## 📌 Features

### 👤 User Management

- Create, update, delete users
- Role-based access (Admin, Instructor, Student)
- Profile management
- Avatar upload (Multer)

### 🔐 Authentication & Authorization

- JWT-based authentication
- Role-based access control (RBAC)
- Secure password hashing (bcrypt)
- Change password functionality

### 🛡️ Security

- DTO validation
- Strong password policy
- Protected routes using Guards

### 🗄️ Database

- Prisma ORM
- PostgreSQL
- Migrations support

### 🐳 DevOps

- Dockerized environment
- Easy setup with Docker Compose

---



## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.


