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

ARG olympia_uid=9500
ARG work_dir=/app

ENV NODE_ENV production
ENV SERVER_HOST 0.0.0.0
ENV PORT 4000

RUN useradd -u ${olympia_uid} -d /home/olympia -m -s /sbin/nologin olympia
# The WORKDIR directive set the ownership of the work directory to root instead
# of USER unless the "buildkit" feature is enabled. To make sure the work
# directory is owned by the proper user for everybody, we manually set the
# ownership.
RUN mkdir -p ${work_dir} && chown ${olympia_uid}:${olympia_uid} ${work_dir}

WORKDIR ${work_dir}

USER ${olympia_uid}:${olympia_uid}

COPY --from=builder --chown=${olympia_uid}:${olympia_uid} ${work_dir}/ .
COPY --chown=${olympia_uid}:${olympia_uid} . .

CMD yarn start
