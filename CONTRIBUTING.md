# Contributing

## Preparing Your Environment

This project is configured for Windows 10/11 machines. If you're using another OS, it may not work properly.

### Prerequisites

Ensure you have the following programs installed and up to date:

- [VSCode](https://code.visualstudio.com/)
- [Node.js LTS and npm](https://nodejs.org/)
- [Regolith](https://bedrock-oss.github.io/regolith/)
- [Minecraft (Bedrock Edition Stable)](https://www.xbox.com/en-US/games/store/minecraft/9MVXMVT8ZKWC)

### Setting Up

1. Run `npm i`
2. Run `npm i` again in the `scripts` directory

## Editing Documentation

Documentation is generated for the public API (`public_api` directory) using [TypeDoc](https://typedoc.org/) based on source code.

Markdown guides are also included. These guides can be found in `public_api/guides`.

To add a new guide, add it to the `children` frontmatter property in `public_api/guides/index.md`.

Before pushing your changes, run `npm run gen-docs` to generate the documentation.

## Checking Your Code

To check your code before commiting, run `npm run check`.

To format your code before commiting, run `npm run fmt`.

You can also run `npm run fmt-check` to format and check.

If your code is not properly formatted or `npm run check` fails, it will not be accepted.

Ensure that you test your new code in Minecraft before pushing changes.

## Building Your Code

To build your code, simply run `regolith run`.

## Before Pushing

Before pushing new changes, follow this checklist:

- Your code is formatted and checked.
- You have tested your changes in Minecraft.
- You have generated the new documentation if you changed the public API.