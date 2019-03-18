# This is used to compile the client-side application.
FROM node:10 as build

ENV NODE_ENV production

WORKDIR /app

# Install the project's dependencies, including dev dependencies
COPY package.json yarn.lock ./
RUN yarn install --pure-lockfile --production=false

# Build the client-side application.
COPY . .
RUN yarn build

# Build the final Docker image that runs the server and serves the client-side
# application.
FROM node:10 as runtime

ENV NODE_ENV production
ENV PORT 4000

WORKDIR /app

# Install the project's dependencies
COPY package.json yarn.lock ./
RUN yarn install --pure-lockfile --production=true

# Add the compiled client-side application
COPY --from=build /app/build/ ./build
# Add the source code for the server
COPY --from=build /app/src/ ./src
COPY --from=build /app/scripts/ ./scripts
# The TS config is required to run the server code
COPY --from=build /app/tsconfig.json ./
# Add the production configuration by default. Environment variables set via
# Docker take precedence over this file.
COPY --from=build /app/.env ./

# Add `version.json` file
COPY --from=build /app/version.json ./

CMD yarn serve
