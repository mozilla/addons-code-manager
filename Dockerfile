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

#
# Install
#
FROM node:16-slim

ARG runas_id=9500
ARG app_dir=/app

ENV NODE_ENV production
ENV SERVER_HOST 0.0.0.0
ENV PORT 4000

RUN useradd -u ${runas_id} -d /home/olympia -m -s /sbin/nologin olympia
# The WORKDIR directive set the ownership of the work directory to root instead
# of USER unless the "buildkit" feature is enabled. To make sure the work
# directory is owned by the proper user for everybody, we manually set the
# ownership.
RUN mkdir -p ${app_dir} && chown ${runas_id}:${runas_id} ${app_dir}

WORKDIR ${app_dir}

USER ${runas_id}:${runas_id}

COPY --from=builder --chown=${runas_id}:${runas_id} ${app_dir}/ .
COPY --chown=${runas_id}:${runas_id} . .

CMD yarn start
