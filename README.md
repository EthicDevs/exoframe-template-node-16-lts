# @ethicdevs/exoframe-template-node-16-lts

Node.JS 16 LTS Alpine (node:lts-alpine) deployment template for [exoframe].

## Usage

```bash
# Install the template into exoframe (needs to be installed globally, or use npx exoframe instead)
$ echo "@ethicdevs/exoframe-template-node-16-lts" | exoframe template
# Change directory to static website to deploy with SPA support (React, Vue, etc)
$ cd ./static_website
# Changes template to this one
$ jq '.template |= "@ethicdevs/exoframe-template-node-16-lts"' json | tee exoframe.json
# Enjoy :)
$ exoframe deploy --update # (or no --update; as you wish)
```

[exoframe]: https://github.com/exoframejs
