#Use the base from the docker hub
FROM node:24-alpine

#Set the working directry
WORKDIR /app 

#Copy the package.json and package-lock.json file
COPY package*.json ./

#install dependencies
RUN npm install

#copy the rest of application file
COPY . .

#Expose the port you app will run on
EXPOSE 3000

#Start The Application
CMD ["npm","start"]

