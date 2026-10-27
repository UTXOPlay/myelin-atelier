# Preserve the original native verifier byte-for-byte; the new profile is separate.
ARG CLASSIC_IMAGE=myelin-atelier:independent-278c834d
FROM ${CLASSIC_IMAGE}
COPY dist ./dist
COPY host ./host
COPY game-host.json package.json package-lock.json ./
COPY target/release/myelin-orbit-expedition ./target/release/myelin-orbit-expedition
