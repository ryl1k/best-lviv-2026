# Changelog

## [1.6.0](https://github.com/ryl1k/best-lviv-2026/compare/v1.5.2...v1.6.0) (2026-04-19)


### Features

* implement subscription tier assignment and retrieval functionality ([2eeffd9](https://github.com/ryl1k/best-lviv-2026/commit/2eeffd99eb07f7f97073197dcbc1b0923f93fb82))
* implement subscription tier assignment and retrieval functionality ([83a1332](https://github.com/ryl1k/best-lviv-2026/commit/83a1332aa47d32110029cd721a2ce472b0b2f370))


### Bug Fixes

* add resource limits for backend service in docker-compose ([f4c20cc](https://github.com/ryl1k/best-lviv-2026/commit/f4c20cca2f103cc582ac7c8410d4df878142c212))
* add resource limits for backend service in docker-compose ([10be4f3](https://github.com/ryl1k/best-lviv-2026/commit/10be4f351001f0d23072be371150f5f4b03c7b6d))
* jwt cors issues ([54d56d4](https://github.com/ryl1k/best-lviv-2026/commit/54d56d489a8662a822cd41dcff600b7255aa6d03))
* remove unnecessary EXPOSE directive from Dockerfile ([614ad14](https://github.com/ryl1k/best-lviv-2026/commit/614ad144e7182c27ba61be3fbfb972a18d991829))
* update Dockerfile to use caching for dependencies and improve build process ([8a953df](https://github.com/ryl1k/best-lviv-2026/commit/8a953dfb2dbc72f9450d36e5c64b80622e8310e5))

## [1.5.2](https://github.com/ryl1k/best-lviv-2026/compare/v1.5.1...v1.5.2) (2026-04-18)


### Bug Fixes

* update fallback API base URL to use secure HTTPS endpoint ([8af4d8f](https://github.com/ryl1k/best-lviv-2026/commit/8af4d8f663b954d2a2f4fc410ebfbd8124052e04))

## [1.5.1](https://github.com/ryl1k/best-lviv-2026/compare/v1.5.0...v1.5.1) (2026-04-18)


### Bug Fixes

* **docs:** update swaggo import path to v2 ([6a89f89](https://github.com/ryl1k/best-lviv-2026/commit/6a89f89b612c52e220bc3ac8907941345a599c4e))
* **docs:** update swaggo import path to v2 ([ca34a92](https://github.com/ryl1k/best-lviv-2026/commit/ca34a92407c05893ff1017bcb34a50ec2f67e8b6))

## [1.5.0](https://github.com/ryl1k/best-lviv-2026/compare/v1.4.0...v1.5.0) (2026-04-18)


### Features

* added ai explanations ([5e68402](https://github.com/ryl1k/best-lviv-2026/commit/5e6840201f1f2650c7c70353419a98c6d86e8bf1))

## [1.4.0](https://github.com/ryl1k/best-lviv-2026/compare/v1.3.0...v1.4.0) (2026-04-18)


### Features

* **audit:** add JSON upload endpoint for land and estate records ([b90fe96](https://github.com/ryl1k/best-lviv-2026/commit/b90fe965940b6422ed1ab7d5152a9dcafa4e7963))
* **audit:** implement subscription checks for CSV upload and JSON upload ([b90fe96](https://github.com/ryl1k/best-lviv-2026/commit/b90fe965940b6422ed1ab7d5152a9dcafa4e7963))
* **auth:** update user authentication to use email instead of username ([ad33aa9](https://github.com/ryl1k/best-lviv-2026/commit/ad33aa99d577c37bfcb5a085c0d3c841e224f998))
* **auth:** update user authentication to use email instead of username ([b90fe96](https://github.com/ryl1k/best-lviv-2026/commit/b90fe965940b6422ed1ab7d5152a9dcafa4e7963))
* **docs:** update Swagger documentation for new user signup and JSON upload endpoints ([b90fe96](https://github.com/ryl1k/best-lviv-2026/commit/b90fe965940b6422ed1ab7d5152a9dcafa4e7963))
* **tasks:** implement user-specific task management and update database schema ([c0cc08a](https://github.com/ryl1k/best-lviv-2026/commit/c0cc08ae3ef2c4079ef8e60b1aaefed8f21f4f7d))
* **user:** add email field to user entity and update related repositories ([b90fe96](https://github.com/ryl1k/best-lviv-2026/commit/b90fe965940b6422ed1ab7d5152a9dcafa4e7963))


### Bug Fixes

* **auth:** adjust login method to authenticate using email ([b90fe96](https://github.com/ryl1k/best-lviv-2026/commit/b90fe965940b6422ed1ab7d5152a9dcafa4e7963))
* **migrations:** update users table to include email and remove unique constraint on username ([b90fe96](https://github.com/ryl1k/best-lviv-2026/commit/b90fe965940b6422ed1ab7d5152a9dcafa4e7963))
* **repo:** change user repository methods to use email instead of username ([b90fe96](https://github.com/ryl1k/best-lviv-2026/commit/b90fe965940b6422ed1ab7d5152a9dcafa4e7963))

## [1.3.0](https://github.com/ryl1k/best-lviv-2026/compare/v1.2.0...v1.3.0) (2026-04-18)


### Features

* add subscription management functionality ([595e4f3](https://github.com/ryl1k/best-lviv-2026/commit/595e4f3b91ea390e957a794f0ae4554e451d0b13))
* add subscription management functionality ([21cbc76](https://github.com/ryl1k/best-lviv-2026/commit/21cbc76dc71b511cd77e4fe150995d9626bf88cd))
* algorithm ([4e20866](https://github.com/ryl1k/best-lviv-2026/commit/4e20866db3972ec03763a7d34429f95abdc5c03d))
* algorithm ([479709c](https://github.com/ryl1k/best-lviv-2026/commit/479709ccaa2a40973215d030e43a457f795a8234))


### Bug Fixes

* remove unnecessary fields from GetById query in UserRepo ([84dfff4](https://github.com/ryl1k/best-lviv-2026/commit/84dfff4edfc1e5698be002da384816d5a3e2f2f3))
* remove unnecessary fields from GetById query in UserRepo ([d273d06](https://github.com/ryl1k/best-lviv-2026/commit/d273d069f2859d6243e8355031fee3daeda865a7))

## [1.2.0](https://github.com/ryl1k/best-lviv-2026/compare/v1.1.0...v1.2.0) (2026-04-18)


### Features

* Implement batch processing for land and estate records ([8375518](https://github.com/ryl1k/best-lviv-2026/commit/8375518993ac5d909755fae1ce3c7b9793706b9d))

## [1.1.0](https://github.com/ryl1k/best-lviv-2026/compare/v1.0.0...v1.1.0) (2026-04-18)


### Features

* added container on deployment ([36d3cd5](https://github.com/ryl1k/best-lviv-2026/commit/36d3cd53f2acbfcd668c874b4ba1498cde5fe899))


### Bug Fixes

* cd on backend ([c08d6f5](https://github.com/ryl1k/best-lviv-2026/commit/c08d6f59691c3714d8a40e4d2189b9c6b9caeb1a))
* cd on backend ([48902f0](https://github.com/ryl1k/best-lviv-2026/commit/48902f013abb5ccd2de399798125ed5d63aefbb2))

## 1.0.0 (2026-04-18)


### Features

* implement user authentication and authorization ([62355c8](https://github.com/ryl1k/best-lviv-2026/commit/62355c8b92519ffc2e0d552adf32c00077de6a82))


### Bug Fixes

* changed ssh drone version ([1642a24](https://github.com/ryl1k/best-lviv-2026/commit/1642a2444467e24bf8435bb8f914ed60a1997690))
* changed ssh drone version ([4c884b8](https://github.com/ryl1k/best-lviv-2026/commit/4c884b8d2b423a4c4bdf0fd714594fe73fb7e136))
