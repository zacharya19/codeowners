# codeowners

> A GitHub App built with [Probot](https://github.com/probot/probot) that does the same as github codeowners feature but without auto assignment, will just block the PR and comment with list of codeowners.

## Setup

```sh
# Install dependencies
yarn install

# Run the bot
yarn start
```

## TODOs
1. Add unit tests.
2. Watch OWNER file changes to update existing PRs.
3. In case of no codeowners or the PRs submitter is the codeowner need another message.

## Contributing

If you have suggestions for how codeowners could be improved, or want to report a bug, open an issue! We'd love all and any contributions.

For more, check out the [Contributing Guide](CONTRIBUTING.md).

## License

[ISC](LICENSE) © 2019 Zacharya Haitin <zacharya19@gmail.com>
