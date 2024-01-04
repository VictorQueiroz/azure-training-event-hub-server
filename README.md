# event-hub-server-tester

## Building

To get the project running, one of the following commands can be called:

```bash
npx tsc
```

```bash
npx tsc -w
```

## Description

This project tries to project handle an Angular project where it has a box that can be moved by the user. Each movement is broadcasted to the user, which later is broadcasted to the correct `clientId`.

We run the server using both instances. One as:

```bash
node . --producer
```

And the consumer server will be automatically bootstrapped by initializing the server without any arguments.
