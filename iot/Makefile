# Makefile for Spresense Gemini Analyzer

# Variables
PYTHON := python3
PIP := pip3
VENV_DIR := venv
REQUIREMENTS := requirements-dev.txt

# Set up virtual environment and install dependencies
.PHONY: setup
setup:
	@echo "Setting up Python virtual environment..."
	$(PYTHON) -m venv $(VENV_DIR)
	@echo "Installing dependencies..."
	@if [ -f "$(VENV_DIR)/bin/activate" ]; then \
		. $(VENV_DIR)/bin/activate && $(PIP) install -r $(REQUIREMENTS); \
	else \
		$(VENV_DIR)\Scripts\activate && $(PIP) install -r $(REQUIREMENTS); \
	fi
	@echo "Setup complete!"

.PHONY: uv
uv:
	@echo "Activating virtual environment and installing dependencies..."
	@if [ -d ".venv" ]; then \
		echo "Virtual environment found at .venv"; \
		. .venv/bin/activate && uv pip install -r requirements-dev.txt && echo "Dependencies installed and virtual environment activated"; \
	else \
		echo "No virtual environment found at .venv"; \
	fi
