# 1. Use Node.js LTS
FROM node:24-alpine

# 2. Set work directory
WORKDIR /usr/src/app

# 3. Copy package files
COPY package*.json ./

# 4. Install dependencies
RUN npm install

# 5. Copy source code
COPY . .

# 6. Generate Prisma client
RUN npx prisma generate

# 7. Build TypeScript
RUN npm run build

# 8. Expose port
EXPOSE 3000

# 9. Start app
CMD ["node", "dist/main.js"]