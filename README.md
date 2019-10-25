# urism

Convert your JS object from/to human readable URI.

[![Build Status](https://travis-ci.com/hackwaly/urism.svg?token=pxqyFKtvSJ5zppZXXVbG&branch=master)](https://travis-ci.com/hackwaly/urism)

## Example

TO DO

## Why

* You want put arbitrary complex json data to querystring, but you find none of existing libraries support it. They do not support booleans, and can't distinguish numbers and strings, or can't represent specific values, such as null, undefined, NaN, Infinity and cyclic references.
* You want your querystring is human readable, and you don't want to pack your data to base64 or other formats.
* You want your querystring is safe for browsers and servers, and spec compliant. Most formats using brackets for array and object. It's unsafe.
* You want your values keep their literal as close as possible, so you can copy it from browser's location bar and paste to other places without addition modifications.

## How

* Specific values encoded to aliases. `true` -> `"$true"`, `null` -> `"$null"`, `NaN` -> `"$nan"` ...
* Reserved characters and non-ascii characters encoded to percent escaped sequence. `"#"` -> `"%23"`, `" "` -> `"%20"`, `"你好"` -> `"%E4%BD%A0%E5%A5%BD"`
* Boolean(s) as object property have syntax sugar. `{a: true}` -> `"?a"`, `{a: false}` -> `"?-a"`.
* Number(s) keep their literal except specific values `NaN`, `Infinity`, `-Infinity`. Numbers will encoded to exponential format if it's shorter.
* String(s) will encoded in raw mode if ambiguity. Eg. It looks like number, array, object or alias. Raw mode start with marker `"?"`. End with marker `"?"`.
* Object(s) except root object start with marker `"+"`. Array start with marker `":"`. Both end with marker `";"`.
* Cyclic references encoded to aliases. `var a = {}; a.a = a; {a:a}` -> `"?a=0$+a=$0"`.
* Date(s) and RegExp(s) encoded to call form of alias. `new Date(2019, 10, 11)` -> `"$date:2019-11-11+08"`.
* End markers except call form can omit if no ambiguity like HTML end tag.
* For more details, please see code.

## Contribution

Buy me a coffee if this library save your time.

### Things to Contribute

* Refine README and example.
* Proposal new rules or improvement on existing rules.
* Fix bugs and add tests.

