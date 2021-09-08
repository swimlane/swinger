# Swinger

> ⚠️ **This project is not maintained any longer. Please feel free to fork it if you need to make changes to the library.** ⚠️

\
[![Build Status](https://travis-ci.org/swimlane/swinger.svg?branch=master)](https://travis-ci.org/swimlane/swinger) [![Codacy Badge](https://api.codacy.com/project/badge/Grade/c13a68ee85a14c029d180154549ab829)](https://www.codacy.com?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=swimlane/swinger&amp;utm_campaign=Badge_Grade) [![Codacy Badge](https://api.codacy.com/project/badge/Coverage/c13a68ee85a14c029d180154549ab829)](https://www.codacy.com?utm_source=github.com&utm_medium=referral&utm_content=swimlane/swinger&utm_campaign=Badge_Coverage)

Swagger aggregation for microservices!

Swinger merges multiple swagger specifications into a single file. This allows you to provide a single specification that covers all your microservices.

## Features

- Merges any number of specifications
- Applies `basePath` (swagger 2.0) and `security` globals to every path before merging
- Namespaces `definitions` (swagger 2.0) if there are collisions
- Updates references (`$ref`) to include proper namespace
- Merges and deduplicates `tags`
- Merges `securityDefinitions` (swagger 2.0), deduplicating when named entry is shared between specs
- No external dependencies
- Typescript typings included

## Install

`npm install @swimlane/swinger`

## Usage

Swinger provides a `merge()` function. This function takes an array of Swagger specs in object (JSON) format. It then merges left to right. The first spec in the array is treated as the _Final_ spec with all the others merged into it.

### Example

```typescript
import * as swinger from 'swinger';

// get your specs from somewhere
const specs = getSpecs();

const masterSpec = {
  info: {
    title: 'Merged Spec',
    description: 'One spec to rule them all'
  },
  basePath: '/api',
  tags: [ 'merged' ]
};

const mergedSpec = swinger.merge([masterSpec, ...specs]);
```

## Credits

`swinger` is a [Swimlane](https://swimlane.com) open-source project; we believe in giving back to the open-source community by sharing some of the projects we build for our application. Swimlane is a security automation and orchestration (SAO) platform. Our platform empowers organizations to manage, respond to and neutralize cyber threats with the adaptability, efficiency and speed necessary to combat today’s rapidly evolving cyber threats.
