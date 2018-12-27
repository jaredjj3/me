---
title: "Study Smarter"
date: 2018-12-27
menu: "projects"
slug: "study-smarter"
authors: ["jaredjohnson"]
---

_This post discusses a lightweight Ruby tool that aids in studying software engineering interview problems._
_The repo that uses the tool can be found [here](https://github.com/jaredjj3/leetcode)._

#### The problem with studying problems

Software engineering interviews typically have a technical
section that tests problem solving skills involving data structures and algorithms.
The best way to study is simple. DO 👏 THE 👏 PROBLEMS 👏

When solving _any_ problem, at some point, you have to ask yourself

>How do I know my solution solves the problem?

In the context of software, that's easy - write tests. Well, not really. Your tests have to be
correct and must test average cases, edge cases, base cases, etc. Ok, it's actually pretty
difficult to get right.

When studying problems from a book, the author(s) usually give you the answers outright. You still
have to make the human evaluation that the code you wrote is functionally equivalent. That's error prone.

Coding challenge websites are almost always backed by tests, but they typically don't expose all aspects of the
tests. How do you know if the tests are correct?

You don't - just write your own tests. It will force you to think about edge cases and may
help you derive a solution.

However, it quickly becomes annoying to copy-and-paste test boilerplate code from one file to another.
Maybe you're like me and wrote a `rake` task to speed the process up. It's still annoying.

More importantly, _it's unecessary_.

#### Computers are good at repetetive tasks

Before I developed this tool, my workflow was something like this:

1. Manually generate a skeleton file `METHOD_NAME=fizz_buzz rake generate`
2. Write tests
3. Write solution
4. Manually run tests `METHOD_NAME=fizz_buzz rake test`

This worked well, but it would be nice if I didn't have to switch between my editor and
terminal (yes, I know that almost all editors have integrated terminals).

Here's what I did instead. First, I created an `index.yaml` file, which contains all the method names
that I'm creating tests and solutions for.

Next, I needed something to watch this index file and create ruby files corresponding to the index
file's content. It would also delete files that are not present in the index file. Since I commit
often, I decided that the file deletion would not be problematic.

I found a ruby library called [guard](https://github.com/guard/guard). Its purpose is to automate
tasks whenever files or directories are modified. Perfect.

This is what the implementation looks like:

```yaml
# index.yaml

methods:
  - fizz_buzz
  - buzz_fizz
  - fizz_fizz
  - fuzz_bizz
```

```ruby
# Guardfile

guard "rake", task: "sync_index" do
  watch(%r{^index.yaml$})
end
```

```ruby
# Rakefile

require "yaml"

def skeleton(method_name)
<<-RUBY.freeze
require "minitest/autorun"
require "byebug"

# PROMPT
=begin

=end

def #{method_name}
end

describe "##{method_name}" do
  it "solves the problem prompt" do
    flunk
  end
end
RUBY
end

def lib_path(method_name)
  File.join("lib", "#{method_name}.rb")
end

task :sync_index do
  # fetch method names from index.yaml
  index = YAML.load(File.read("index.yaml"))
  methods = index.fetch("methods")

  # create missing method files in lib dir
  methods.each do |method|
    path = lib_path(method)
    next if File.exist?(path) || method.nil?
    File.open(path, "w") { |file| file.write(skeleton(method)) }
    puts "created #{path}"
  end

  # destroy extra method files in lib dir
  (Dir["lib/*"] - methods.map(&method(:lib_path))).each do |path|
    if File.exist?(path) # double check file exists just to be sure
      File.delete(path)
      puts "deleted #{path}"
    end
  end
end
```

Cool! So, after I run `guard`, I can now create files by adding it to the `methods` array in
`index.yaml`.

Why stop there? I improved the workflow by watching all of the files in the `lib` directory, and
running the tests in the file that changed.

It looks like this:

```ruby
# Guardfile

guard "rake", task: "test", run_on_start: false do
  watch(%r{^lib/.+.rb$})
end
```

```ruby
# Rakefile

task :test, :paths do |t, args|
  paths = args.paths || [ENV.fetch("TEST")]

  paths.each do |path|
    cmd = "ruby #{path}"
    puts cmd
    system(cmd)
  end
end
```

The only time I had to touch the terminal was to start the `guard` process. That's `O(1)` terminal
touches. Nice.

#### There's no such thing as bug free software

One of the weaknesses of running tests every file change event is infinite loops. I've
definitely written something like this in the middle of implementing a solution:

```ruby
def fuzz_bizz(arr)
  left_ndx = 0
  right_ndx = arr.size
  while left_ndx < right_ndx
  end

  # ...
end
```

If `arr.size` returns any number >= 0, calling this method will cause in an infinite loop. This
will cause the `guard` process to hang until it's manually killed.

I _could_ have a watcher process spawn on test start, and send a signal to stop the test after
a certain amount of time passes. The watcher would also need to know if a particular test is
running or not. It should also be killed if `guard` is not running a test. I'd have to write a test
driver to perform this custom behavior.

Nope. That's too complicated.

```ruby
def fuzz_bizz(arr)
  left_ndx = 0
  right_ndx = arr.size
  # Line below gets uncommented when ready to test
  # while left_ndx < right_ndx
  while false # Line gets deleted when ready to test
  end

  # ...
end
```

Normally I don't shy away from technical challenges, but I think time is better spent focusing on
data structure and algorithms for now.

Maybe in V2.

