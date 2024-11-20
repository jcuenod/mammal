# Mammal

Mammal is an LLM client application that allows users to have chat conversations with LLM providers.

![Mammal](./screenshot.png)

# Supported Providers

- [x] OpenAI
- [x] Google
- [x] Anthropic
- [x] Groq
- [x] Cerebras
- [x] Custom OpenAI API Compatible Providers (like llama.cpp and ollama)
- [ ] Others

# Features

Most of the complicated coding has gone into supporting threaded conversations that allow forking. The LLM called by Mammal can be changed from message to message, and the conversation can be forked into multiple threads.

It is also possible to search your conversations for specific content. The search functionality is backed by a SQLite's FTS.

# Roadmap (i.e., ideas)

- [ ] Papercuts:
  - [ ] Better support for scrolling to searched messages
  - [ ] Remembering previous model selection
  - [ ] Better error handling
  - [ ] Deleting subtrees within threads
  - [ ] Automatic cleaning up of sqlite message tree
- [ ] Automatically downloading list of available models for known providers
- [ ] Support for more providers(?)
- [ ] Pro "workspace" features?

# Stack

- Tauri
- React
- Tailwind CSS
- React-markdown (with gfm)
- LLM sdks (OpenAI and Anthropic)
- SQLite

Honestly, very few dependencies.
