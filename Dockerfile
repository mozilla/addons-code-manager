#
# Build
#
FROM node:16-slim AS builder

WORKDIR /app

# Install the project's dependencies, including dev dependencies.
COPY package.json yarn.lock ./

# python and build-essential are needed or the `yarn install --pure-lockfile`
# fails while trying to invoke `/app/node_modules/node-pty`.
RUN apt-get update -y && apt-get install -y python3 build-essential
RUN yarn install --pure-lockfile --production=false

# Build the application
RUN yarn build

#
# Install
#
FROM node:16-slim

ARG app_uid=9500
ARG app_dir=/app

ENV NODE_ENV production
ENV SERVER_HOST 0.0.0.0
ENV PORT 4000

RUN useradd -u ${app_uid} -d /home/app -m -s /sbin/nologin app
# The WORKDIR directive set the ownership of the work directory to root instead
# of USER unless the "buildkit" feature is enabled. To make sure the work
# directory is owned by the proper user for everybody, we manually set the
# ownership.
RUN mkdir -p ${app_dir} && chown ${app_uid}:${app_uid} ${app_dir}

WORKDIR ${app_dir}

USER ${app_uid}:${app_uid}

COPY --from=builder --chown=${app_uid}:${app_uid} ${app_dir}/ .
COPY --chown=${app_uid}:${app_uid} . .

CMD yarn start
