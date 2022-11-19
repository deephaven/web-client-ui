## Purpose

This folder exists as a way to override any types that we don't like. For example, memoizee types the input function as `(...args: any[])` which does not enforce any type checking on memoized functions. By overriding to `(...args: unknown[])`, we get type errors when we fail to declare these types.

This should be used sparingly as it might not play nicely if we need to update packages/types. In the case of memoizee, it's a tiny package with a very small types file. It was just copied from `node_modules/@types/memoizee` to this directory.

The
