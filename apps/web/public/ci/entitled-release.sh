#!/bin/sh
# Publishes a release to an Entitled portal from CI.
#
# Usage: entitled-release.sh FILE...
#
# Required environment:
#   ENTITLED_URL       Portal URL, e.g. https://portal.example.com
#   ENTITLED_API_KEY   CI API key (ent_...) created under Admin > API keys
#   ENTITLED_PRODUCT   Product slug
# Optional:
#   ENTITLED_VERSION   Defaults to CI_COMMIT_TAG
#   ENTITLED_TITLE     Release title
#   ENTITLED_CHANGELOG Path to a Markdown changelog for this release
#   ENTITLED_PUBLISH   "true" publishes once every file is verified (otherwise the
#                      portal's draft/auto-publish setting decides)
#
# Needs: curl, jq, sha256sum.
set -eu

fail() { echo "entitled: $*" >&2; exit 1; }

: "${ENTITLED_URL:?set ENTITLED_URL}"
: "${ENTITLED_API_KEY:?set ENTITLED_API_KEY}"
: "${ENTITLED_PRODUCT:?set ENTITLED_PRODUCT}"
VERSION="${ENTITLED_VERSION:-${CI_COMMIT_TAG:-}}"
[ -n "$VERSION" ] || fail "set ENTITLED_VERSION or run on a tag pipeline"
[ "$#" -gt 0 ] || fail "pass at least one file to upload"
for tool in curl jq sha256sum; do
  command -v "$tool" >/dev/null 2>&1 || fail "$tool is required"
done

API="${ENTITLED_URL%/}/api"

api() {
  method="$1"; path="$2"; shift 2
  curl -fsS -X "$method" "$API$path" \
    -H "Authorization: Bearer $ENTITLED_API_KEY" \
    -H 'Content-Type: application/json' "$@"
}

product_id=$(api GET "/products?slug=$ENTITLED_PRODUCT" | jq -r '.[0].id // empty')
[ -n "$product_id" ] || fail "product '$ENTITLED_PRODUCT' not found"

changelog=""
if [ -n "${ENTITLED_CHANGELOG:-}" ]; then
  [ -f "$ENTITLED_CHANGELOG" ] || fail "changelog file $ENTITLED_CHANGELOG not found"
  changelog=$(cat "$ENTITLED_CHANGELOG")
fi

release=$(jq -n \
  --arg productId "$product_id" --arg version "$VERSION" \
  --arg title "${ENTITLED_TITLE:-}" --arg changelog "$changelog" \
  '{productId: $productId, version: $version, title: $title, changelog: $changelog}' |
  api POST /releases --data-binary @-)
release_id=$(echo "$release" | jq -r '.id')
echo "entitled: created release $VERSION ($(echo "$release" | jq -r '.status'))"

for file in "$@"; do
  [ -f "$file" ] || fail "file $file not found"
  name=$(basename "$file")
  size=$(wc -c < "$file" | tr -d ' ')
  sha=$(sha256sum "$file" | cut -d ' ' -f 1)

  upload=$(jq -n --arg name "$name" --argjson size "$size" --arg sha "$sha" \
    '{fileName: $name, sizeBytes: $size, sha256: $sha}' |
    api POST "/releases/$release_id/artifacts" --data-binary @-)
  url=$(echo "$upload" | jq -r '.uploadUrl')
  content_type=$(echo "$upload" | jq -r '.uploadHeaders["content-type"]')
  artifact_id=$(echo "$upload" | jq -r '.artifact.id')

  curl -fsS -X PUT -H "Content-Type: $content_type" --upload-file "$file" "$url" >/dev/null
  api POST "/artifacts/$artifact_id/complete" >/dev/null
  echo "entitled: uploaded $name ($size bytes)"
done

# The portal recomputes every checksum; wait until all files are verified.
attempts=0
while :; do
  states=$(api GET "/releases/$release_id" | jq -r '[.artifacts[].status] | unique | join(",")')
  case "$states" in
    *failed*) fail "a file failed verification (checksum or size mismatch)" ;;
    *pending*|*processing*) ;;
    *) break ;;
  esac
  attempts=$((attempts + 1))
  [ "$attempts" -lt 120 ] || fail "timed out waiting for checksum verification"
  sleep 5
done
echo "entitled: all files verified"

if [ "${ENTITLED_PUBLISH:-false}" = "true" ]; then
  status=$(api GET "/releases/$release_id" | jq -r '.status')
  if [ "$status" = "draft" ]; then
    api POST "/releases/$release_id/publish" >/dev/null
    echo "entitled: published $VERSION"
  fi
fi

echo "entitled: ${ENTITLED_URL%/}/admin/releases/$release_id"
