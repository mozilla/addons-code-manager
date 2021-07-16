FROM node:14

ENV NODE_ENV production
ENV SERVER_HOST 0.0.0.0
ENV PORT 4000

WORKDIR /app

# Install the project's dependencies, including dev dependencies.
COPY package.json yarn.lock ./
RUN yarn install --pure-lockfile --production=false

COPY . .

CMD yarn start
