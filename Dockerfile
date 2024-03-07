FROM node:18

WORKDIR /Backend-project

COPY  . /Backend-project

RUN npm install 

EXPOSE 9000

CMD [ "npm " , "run" , "dev"]

