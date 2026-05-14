# 1. Use an official Node.js image as the base
FROM node:20

# 2. Set the folder inside the "virtual computer" where our code will live
WORKDIR /app

# 3. Copy only the dependency files first (for faster building)
COPY package*.json ./

# 4. Install the libraries (OpenAI, Socket.io, mongoose, etc.)
RUN npm install

# 5. Copy the rest of your project code
COPY . .

# 6. Tell Docker which port your app runs on
EXPOSE 5000

# 7. The command to start the server
CMD ["npm", "start"]