const axios = require("axios");

/**
 * Handles interactions between the client and a GitHub repository.
 */
class GitHandler {
	static gitPlatforms = {
		github: "https://api.github.com/repos/:owner/:repo",
		gitlab: "https://gitlab.com/api/v4/projects/:repo",
		bitbucket: "https://api.bitbucket.org/2.0/repositories/:owner/:repo",
		azuredevops: "https://dev.azure.com/:owner/repositories/:repo",
	};

	/**
	 * @param {object} gitApiRepoPath Your Git platform's repo api url. The `GitHandler.gitPlatforms` object contains several common paths.
	 * @param {string} authToken The authorization key provided by your Git platform.
	 * @param {string} repositoryOwner The name of the repository owner.
	 * @param {string} repositoryName The repository's name.
	 */
	constructor(
		gitApiRepoPath = this.constructor.gitPlatforms.github,
		authToken,
		repositoryOwner,
		repositoryName
	) {
		//         // Usage example
		// createFile("new-file.txt", "File content")
		// .then(() => commitAndPushChanges("main", "Added a new file"))
		// .catch((error) => console.error(error));

		this.gitApiRepoPath = gitApiRepoPath;
		this.authToken = authToken;
		this.repositoryOwner = repositoryOwner;
		this.repositoryName =
			repositoryName &&
			(repositoryName.endsWith(".git")
				? repositoryName.replace(".git", "")
				: repositoryName);
	}

	get repositoryURL() {
		try {
			const { gitApiRepoPath, repositoryOwner, repositoryName } = this;

			const customPath = !Object.values(
				this.constructor.gitPlatforms
			).includes(gitApiRepoPath);

			const updatedPath = customPath
				? gitApiRepoPath
				: gitApiRepoPath
						.replace(/:owner/g, repositoryOwner)
						.replace(/:repo/g, repositoryName);

			return `${updatedPath}`;
		} catch (err) {
			console.error("Failed to determine repository URL:", err);
		}
	}

	/**
	 * Handle caught errors.
	 * @param {Array<*>} errors The array of error messages or objects that were thrown.
	 */
	errorHandler = (...errors) => {
		const errorMapper = (error) => {
			if (typeof error === "string") return error;
			else {
				if (error.isAxiosError) {
					return error.response.data.message;
				} else return error.toString();
			}
		};

		const errorMap = errors.map((error) => errorMapper(error)).join(" ");

		console.error(errorMap);
		return errorMap;
	};

	/**
	 * Makes an authenticated API request to the Git hosting platform.
	 * @param {string} url The URL of the API endpoint.
	 * @param {string} method The HTTP method for the request (e.g., GET, POST, PATCH).
	 * @param {Object} [data] The request payload data (optional).
	 * @returns {Promise<any>} A Promise that resolves with the response data.
	 * @throws {Error} If there was an error making the API request or if the response indicates an error.
	 */
	apiRequest = async (url, method, data = {}) => {
		const { authToken } = this;

		const response = await axios({
			method,
			url,
			headers: {
				Authorization: `Bearer ${authToken}`,
				"Content-Type": "application/json",
			},
			data,
		});

		return response.data;
	};

	/**
	 * Creates a new file in the Git repository.
	 * @param {string} filePath The path of the file to create.
	 * @param {string} content The content of the file.
	 * @param {boolean} overwrite Set to `true` to overwrite existing files.
	 * @param {string} message An optional message to attach to the commit.
	 * @returns {Promise<void>} A Promise that resolves when the file is created successfully.
	 */
	commitFileAndPush = async (
		filePath,
		content,
		overwrite = false,
		message = "Created new file."
	) => {
		try {
			const fileExists = await this.doesFileExist(filePath);

			if (!overwrite && fileExists)
				throw "A file with that name already exists in that directory.";

			const { repositoryURL } = this;

			const fileContent = Buffer.from(content).toString("base64");
			const apiUrl = `${repositoryURL}/contents/${filePath}`;

			const data = {
				message: message,
				content: fileContent,
				sha: fileExists,
			};

			const response = await this.apiRequest(apiUrl, "PUT", data);
			console.log(
				`File ${fileExists ? "updated" : "created"}:`,
				response.commit.sha
			);
		} catch (err) {
			this.errorHandler("Error creating file:", err);
		}
	};

	/**
	 * Checks if a file exists in the Git repository.
	 * @param {string} filePath The path of the file to check.
	 * @returns {Promise<FileCheckResult>} A Promise that resolves with the result of the file check.
	 */
	doesFileExist = async (filePath) => {
		try {
			const { repositoryURL } = this;

			const apiUrl = `${repositoryURL}/contents/${filePath}`;

			const { sha } = await this.apiRequest(apiUrl, "GET");

			return sha;
		} catch (err) {
			// If a 404 is provided, that means the file doesn't exist.
			if (err.response && err.response.status === 404) {
				return false;
			}

			this.errorHandler("Error checking file:", err);
		}
	};

	/**
	 * Retrieves the contents of a file from the Git repository.
	 * @param {string} filePath The path of the file to retrieve.
	 * @returns {Promise<string>} A Promise that resolves with the contents of the file.
	 */
	getFileContents = async (filePath) => {
		try {
			if (!(await this.doesFileExist(filePath)))
				throw "File does not exist.";

			const { repositoryURL } = this;

			const apiUrl = `${repositoryURL}/contents/${filePath}`;

			const file = await this.apiRequest(apiUrl, "GET");
			const content = Buffer.from(file.content, "base64").toString(
				"utf-8"
			);

			return content;
		} catch (err) {
			this.errorHandler("Error retrieving file:", err);
		}
	};

	/**
	 * Deletes a file from the Git repository.
	 * @param {string} filePath The path of the file to delete.
	 * @param {string} message An optional message to attach to the commit.
	 * @returns {Promise<void>} A Promise that resolves when the file is deleted successfully.
	 */
	deleteFile = async (filePath, message = "Deleted file.") => {
		try {
			const fileExists = await this.doesFileExist(filePath);

			if (!fileExists) throw "File does not exist.";

			const { repositoryURL } = this;

			const apiUrl = `${repositoryURL}/contents/${filePath}`;

			const data = {
				message: message,
				sha: fileExists, // Provide the existing file's SHA to delete it
			};

			await this.apiRequest(apiUrl, "DELETE", data);
			console.log(`File at path "${filePath}" deleted.`);
		} catch (err) {
			this.errorHandler("Error deleting file:", err);
		}
	};

	/**
	 * Renames a file in the Git repository.
	 * @param {string} filePath The current path of to file.
	 * @param {string} newPath The new path for the file.
	 * @param {string} message An optional message to attach to the commit.
	 * @returns {Promise<void>} A Promise that resolves when the file is renamed successfully.
	 */
	renameFile = async (filePath, newPath, message = "Renamed file.") => {
		try {
			const { repositoryURL } = this;

			const currentFileUrl = `${repositoryURL}/contents/${filePath}`;
			const newFileUrl = `${repositoryURL}/contents/${newPath}`;

			const currentFile = await this.apiRequest(currentFileUrl, "GET");

			const data = {
				message: message,
				content: currentFile.content,
				sha: currentFile.sha, // Provide the existing file's SHA to rename it
			};

			// Create the new file at the new path
			await this.apiRequest(newFileUrl, "PUT", data);

			// Delete the old file from the current path
			await this.apiRequest(currentFileUrl, "DELETE", {
				message: `Deleted file ${filePath}`,
				sha: currentFile.sha,
			});

			console.log(`"${filePath}" is now "${newPath}"`);
		} catch (err) {
			this.errorHandler("Error renaming file:", err);
		}
	};

	/**
	 * Lists the file tree of the Git repository recursively.
	 * @param {string} [path] The path of the directory to list the file tree. (optional, defaults to the root directory)
	 * @returns {Promise<FileTreeNode>} A Promise that resolves with the file tree.
	 */
	getFileTree = async (path = "") => {
		try {
			const { repositoryURL } = this;
			const apiUrl = `${repositoryURL}/contents/${path}`;

			const fileTree = await this.apiRequest(apiUrl, "GET");

			const fileTreeNodes = await Promise.all(
				fileTree.map(async (item) => {
					if (item.type === "dir") {
						const children = await this.listFileTree(item.path);
						return { ...item, children };
					}
					return item;
				})
			);

			return fileTreeNodes;
		} catch (err) {
			this.errorHandler("Error listing file tree:", err);
		}
	};
}

module.exports = GitHandler;
