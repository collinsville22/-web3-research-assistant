# 🤝 Contributing to Web3 Research Assistant

Thank you for your interest in contributing to the Web3 Research Assistant! This document provides guidelines for contributing to the project.

## 🚀 Getting Started

1. **Fork the repository**
2. **Clone your fork**
   ```bash
   git clone https://github.com/your-username/web3-research-assistant.git
   cd web3-research-assistant
   ```
3. **Install dependencies**
   ```bash
   npm install
   ```
4. **Set up environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

## 🛠️ Development Workflow

### Making Changes

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow the existing code style and conventions
   - Add tests for new functionality
   - Update documentation as needed

3. **Test your changes**
   ```bash
   npm test
   npm start server  # Test the web interface
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: your descriptive commit message"
   ```

5. **Push and create a Pull Request**
   ```bash
   git push origin feature/your-feature-name
   ```

### Code Style Guidelines

- **JavaScript**: Use ES6+ features, async/await for promises
- **Comments**: Document complex logic and JuliaOS integrations
- **Error Handling**: Always include proper error handling with fallbacks
- **Testing**: Write tests for new features and bug fixes

### Commit Message Format

Follow conventional commits:
- `feat:` - New features
- `fix:` - Bug fixes  
- `docs:` - Documentation updates
- `test:` - Test improvements
- `refactor:` - Code refactoring
- `perf:` - Performance improvements

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
node src/tests/agents.test.js

# Run with coverage
npm run test:coverage
```

### Writing Tests

- Add tests to `src/tests/` directory
- Use Node.js built-in test runner
- Test both success and failure scenarios
- Mock external API calls when appropriate

## 📝 Documentation

### Updating Documentation

- Update README.md for new features
- Add JSDoc comments for new functions
- Update DEPLOYMENT.md for deployment changes
- Include examples in documentation

### JuliaOS Integration

When adding JuliaOS features:
- Document the specific APIs used
- Include fallback behavior for when JuliaOS is unavailable
- Add configuration options to `src/config/juliaos.js`
- Test with both live and mock JuliaOS backends

## 🐛 Bug Reports

### Before Submitting

1. Check existing issues for duplicates
2. Test with the latest version
3. Provide clear reproduction steps

### Bug Report Template

```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What you expected to happen.

**Environment:**
- OS: [e.g., Windows, macOS, Linux]
- Node.js version: [e.g., 18.15.0]
- JuliaOS version: [if applicable]

**Additional context**
Any other context about the problem.
```

## 💡 Feature Requests

### Enhancement Ideas

We welcome suggestions for:
- New analysis agents
- Additional blockchain integrations
- UI/UX improvements
- Performance optimizations
- JuliaOS framework enhancements

### Feature Request Template

```markdown
**Is your feature request related to a problem?**
A clear description of what the problem is.

**Describe the solution you'd like**
A clear description of what you want to happen.

**Describe alternatives you've considered**
Other solutions you've considered.

**JuliaOS Integration**
How this feature would use JuliaOS capabilities.

**Additional context**
Any other context about the feature request.
```

## 🎯 Areas for Contribution

### High Priority

- [ ] Additional blockchain integrations (Polygon, Avalanche, etc.)
- [ ] Enhanced smart contract analysis agents
- [ ] Real-time data feeds integration
- [ ] Performance optimizations
- [ ] Mobile app development

### Medium Priority

- [ ] Additional LLM provider integrations
- [ ] Advanced visualization features
- [ ] Export functionality (PDF, CSV)
- [ ] Webhook integrations
- [ ] Advanced caching strategies

### Good First Issues

- [ ] UI improvements and bug fixes
- [ ] Documentation updates
- [ ] Test coverage improvements
- [ ] Code cleanup and refactoring
- [ ] Configuration enhancements

## 🏆 Recognition

Contributors will be:
- Listed in the project README
- Mentioned in release notes
- Invited to join the project maintainers (for significant contributions)

## 📞 Getting Help

- **Issues**: [GitHub Issues](https://github.com/your-username/web3-research-assistant/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/web3-research-assistant/discussions)
- **Discord**: [Join our Discord server](https://discord.gg/your-discord)

## 📄 Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](https://www.contributor-covenant.org/version/2/1/code_of_conduct/). By participating, you are expected to uphold this code.

---

**Thank you for contributing to the Web3 Research Assistant! 🚀**