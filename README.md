# git-applet

A bare-bones applet that handles basic Git commands on common Git-hosting platforms.

# Documentation

## Installation

Install by running:

```terminal
npm install -g git-applet
```

or:

```terminal
npm install -g https://github.com/NotTimTam/git-applet.git
```

## Importing into your project

```js
const GA = require("git-applet");

const gitHandler = new GA(
	GA.gitPlatforms.github, // The repository api path for your Git platform. Common ones are stored under GA.gitPlatforms.
	"my_example_token", // Your Git platform access token.
	"NotTimTam", // The owner of the repository.
	"my-repo" // The name of the repository.
);
```

## commitFileAndPush

Create or edit a file with a specific path.

```js
// ...

gitHandler.commitFileAndPush(
	"README.md", // The path to commit the file to. Including the file's name and file extension.
	"Hello, world!", // The content of the file.
	true, // Whether to overwrite an existing file or not.
	"Added README.md." // An optional commit message.
);
```

## doesFileExist

Check if a file exists in a directory.

```js
// ...

// Returns the SHA of the existing file, or false.
gitHandler.doesFileExist(
	"README.md" // The path to the file to check.
);
```

## getFileContents

Get the contents of a file in the repository.

```js
// ...

gitHandler.getFileContents(
	"README.md" // The path to the file.
);
```

## deleteFile

Delete an existing file.

```js
// ...

gitHandler.deleteFile(
	"README.md", // The path to the file.
	"Deleted README.md." // An optional commit message.
);
```

## renameFile

Rename and/or move a file to a new directory.

```js
// ...

gitHandler.renameFile(
	"README.md", // The existing file location.
	"old/docs/README.md", // The new file location/name.
	"Moved the old README." // An optional commit message.
);
```

## apiRequest

Send a custom API request to the Git api.

```js
// ...

gitHandler.apiRequest(
	`${gitHandler.repositoryURL}/contents/README.md`, // The sub-path of the repo API url.
	"POST", // The API request method.
	myData // The data to send with the request.
);
```
