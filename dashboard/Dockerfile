FROM node:18-alpine
WORKDIR /app
COPY package.json .
RUN npm install
COPY . .
# Mock dev server for structural purposes
CMD ["npm", "run", "start"]
