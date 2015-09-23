# wildflower-touch

A [Wildflower](https://github.com/pschanely/wildflower) IDE for touch devices.  Point-free style has an advantage on mobile because you don't have to name many things (but I can't really handle much of that, so it's got variables too).  It's pure functional, but I stubbornly refuse to make analogies with concepts in graduate level mathematics.

This is a hack.  A concept.  It really doesn't work yet.  That said, if you're interested in this sort of thing, want to give me feedback, or would like to help evolve it, I'd love to hear from you.

Here's a demo of me implementing the solution to [problem one](https://projecteuler.net/problem=1) of Project Euler (finding the multiples of 3 and 5 up to some limit and taking their sum):

![Wildflower solution to Project Euler, problem one](https://raw.githubusercontent.com/pschanely/wildflower-touch/master/eulerone.gif)

Pure functional languages let us do some pretty great things in the IDE.  More people should be talking about that.  Here's one: given any value in a test, trace it back to the point in the code where it first appeared:

![Data path tracing in wildflower-touch](https://raw.githubusercontent.com/pschanely/wildflower-touch/master/datapath.gif)

## Install

This thing really isn't ready for anyone to use it, but if you'd like to build it anyway, you should be able to do this:

```
$ npm install --global gulp cordova # (if you don't already have these)
$ cd client
$ npm install
$ gulp app
$ cd ../mobile
$ cordova platform add android # (or ios!)
$ cordova run android # (or ios!)
```
